import Schema from '../models/schema'
import Text from '../models/text'

/*
    This module contains the default schema to normalize documents
 */


/**
 * A default schema rule to only allow block nodes in documents.
 *
 * @type {Object}
 */

const DOCUMENT_CHILDREN_RULE = {
  match: (node) => {
    return node.kind == 'document'
  },
  validate: (document) => {
    const { nodes } = document
    const invalids = nodes.filter(n => n.kind != 'block')
    return invalids.size ? invalids : null
  },
  normalize: (transform, document, invalids) => {
    return invalids.reduce((t, n) => t.removeNodeByKey(n.key), transform)
  }
}

/**
 * A default schema rule to only allow block, inline and text nodes in blocks.
 *
 * @type {Object}
 */

const BLOCK_CHILDREN_RULE = {
  match: (node) => {
    return node.kind == 'block'
  },
  validate: (block) => {
    const { nodes } = block
    const invalids = nodes.filter(n => n.kind != 'block' && n.kind != 'inline' && n.kind != 'text')
    return invalids.size ? invalids : null
  },
  normalize: (transform, block, invalids) => {
    return invalids.reduce((t, n) => t.removeNodeByKey(n.key), transform)
  }
}

/**
 * A default schema rule to have at least one text node in blocks
 *
 * @type {Object}
 */

const MIN_TEXT_RULE = {
    match: (object) => {
      return object.kind == 'block' || object.kind == 'inline'
    },
    validate: (node) => {
      const { nodes } = node
      return nodes.size === 0 ? true : null
    },
    normalize: (transform, node) => {
      return transform.insertNodeByKey(node.key, 0, Text.create())
    }
}

/**
 * A default schema rule to only allow inline and text nodes in inlines.
 *
 * @type {Object}
 */

const INLINE_CHILDREN_RULE = {
  match: (object) => {
    return object.kind == 'inline'
  },
  validate: (inline) => {
    const { nodes } = inline
    const invalids = nodes.filter(n => n.kind != 'inline' && n.kind != 'text')
    return invalids.size ? invalids : null
},
  normalize: (transform, inline, invalids) => {
    return invalids.reduce((t, n) => t.removeNodeByKey(n.key), transform)
  }
}

/**
 * A default schema rule to ensure that void nodes contain a single space of content.
 *
 * @type {Object}
 */

const INLINE_VOID_TEXT_RULE = {
  match: (object) => {
    return (object.kind == 'inline' || object.kind == 'block') && object.isVoid
  },
  validate: (node) => {
    return node.text !== ' ' || node.nodes.size !== 1
  },
  normalize: (transform, node) => {
      transform = node.nodes.reduce((t, child) => {
          return t.removeNodeByKey(child.key)
      }, transform)

      return transform.insertNodeByKey(node.key, 0, Text.createFromString(' '))
  }
}

/**
 * A default schema rule to ensure that inline void nodes are surrounded with text nodes
 *
 * @type {Object}
 */

const INLINE_VOID_TEXTS_AROUND_RULE = {
  match: (object) => {
    return object.kind == 'block'
  },
  validate: (block) => {
    const invalids = block.nodes.reduce((accu, child, index) => {
      if (child.kind === 'block' || !child.isVoid) {
        return accu
      }

      const prevNode = index > 0 ? block.nodes.get(index - 1) : null
      const nextNode = block.nodes.get(index + 1)

      const prev = (!prevNode || prevNode.kind !== 'text')
      const next = (!nextNode || nextNode.kind !== 'text')

      if (next || prev) {
        accu.push({ next, prev, index })
      }

      return accu
    }, [])

    return invalids.length ? invalids : null
  },
  normalize: (transform, block, invalids) => {
    return invalids.reduce((t, { index, next, prev }) => {
      if (prev) t = transform.insertNodeByKey(block.key, index, Text.create())
      if (next) t = transform.insertNodeByKey(block.key, index + 1, Text.create())
      return t
    }, transform)
  }
}

/**
 * Join adjacent text nodes.
 *
 * @type {Object}
 */

const NO_ADJACENT_TEXT_RULE = {
  match: (object) => {
    return object.kind == 'block' || object.kind == 'inline'
  },
  validate: (node) => {
    const { nodes } = node
    const invalids = nodes
      .map((n, i) => {
        const next = nodes.get(i + 1)
        if (n.kind !== 'text' || !next || next.kind !== 'text') {
          return
        }

        return [n, next]
      })
      .filter(Boolean)

    return invalids.size ? invalids : null
  },
  normalize: (transform, node, pairs) => {
    return pairs
        // We reverse the list since we want to handle 3 consecutive text nodes
        .reverse()
        .reduce((t, pair) => {
          const [ first, second ] = pair
          return t.joinNodeByKey(second.key, first.key)
        }, transform)
  }
}

/**
 * The default schema.
 *
 * @type {Object}
 */

const schema = Schema.create({
  rules: [
    DOCUMENT_CHILDREN_RULE,
    BLOCK_CHILDREN_RULE,
    MIN_TEXT_RULE,
    INLINE_CHILDREN_RULE,
    INLINE_VOID_TEXT_RULE,
    INLINE_VOID_TEXTS_AROUND_RULE,
    NO_ADJACENT_TEXT_RULE
  ]
})

export default schema