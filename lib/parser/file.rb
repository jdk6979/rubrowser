require 'parser/current'

module Rubrowser
  module Parser
    class File
      FILE_SIZE_LIMIT = 2 * 1024 * 1024

      attr_reader :file, :definitions, :occurences

      def initialize(file)
        @file = file
        @definitions = []
        @occurences = []
      end

      def parse
        if file_valid?(file)
          code = ::File.read(file)
          ast = ::Parser::CurrentRuby.parse(code)
          constants = parse_block(ast)

          @definitions = constants[:definitions].uniq
          @occurences = constants[:occurences].uniq
        end
      rescue ::Parser::SyntaxError
        warn "SyntaxError in #{file}"
      end

      def file_valid?(file)
        !::File.symlink?(file) &&
          ::File.file?(file) &&
          ::File.size(file) <= FILE_SIZE_LIMIT
      end

      private

      def parse_block(node, parents = [])
        return empty_result unless node.is_a?(::Parser::AST::Node)

        case node.type
        when :module
          parse_module(node, parents)
        when :class
          parse_class(node, parents)
        when :const
          parse_const(node, parents)
        else
          node
            .children
            .map { |n| parse_block(n, parents) }
            .reduce { |a, e| merge_constants(a, e) } || empty_result
        end
      end

      def parse_module(node, parents = [])
        name = resolve_const_path(node.children.first, parents)
        node
          .children[1..-1]
          .map { |n| parse_block(n, name) }
          .reduce { |a, e| merge_constants(a, e) }
          .tap { |constants| constants[:definitions].unshift(name) }
      end

      def parse_class(node, parents = [])
        name = resolve_const_path(node.children.first, parents)
        node
          .children[1..-1]
          .map { |n| parse_block(n, name) }
          .reduce { |a, e| merge_constants(a, e) }
          .tap { |constants| constants[:definitions].unshift(name) }
      end

      def parse_const(node, parents = [])
        constant = resolve_const_path(node)
        namespace = parents[0...-1]
        constants = if namespace.empty? || constant.first.nil?
                      [{ parents => [constant.compact] }]
                    else
                      [{ parents => (namespace.size - 1).downto(0).map { |i| namespace[0..i] + constant }.push(constant) }]
                    end
        { definitions: [], occurences: constants }
      end

      def merge_constants(c1, c2)
        {
          definitions: c1[:definitions] + c2[:definitions],
          occurences: c1[:occurences] + c2[:occurences]
        }
      end

      def resolve_const_path(node, parents = [])
        return parents unless node.is_a?(::Parser::AST::Node) && [:const, :cbase].include?(node.type)
        resolve_const_path(node.children.first, parents) + [node.children.last]
      end

      def empty_result
        { definitions: [], occurences: [] }
      end
    end
  end
end
