import { $createListItemNode, $isListItemNode, $isListNode } from '@lexical/list'
import type { ElementNode } from 'lexical'
import { $nodesOfType, $isElementNode, $isTextNode } from 'lexical'
import { $unwrapSuggestionNode } from './Utils'
import { ProtonNode, $isSuggestionNode } from './ProtonNode'
import { $createLinkNode, $isLinkNode } from '@lexical/link'
import { $patchStyleText } from '@lexical/selection'
import { $isImageNode } from '../Image/ImageNode'
import { $findMatchingParent } from '@lexical/utils'
import { $deleteTableColumn, $isTableCellNode, $isTableNode, $isTableRowNode } from '@lexical/table'
import { blockTypeToCreateElementFn } from '../BlockTypePlugin'
import { $isCustomListNode } from '../CustomList/$isCustomListNode'
import type {
  PropertyChangeSuggestionProperties,
  AlignChangeSuggestionProperties,
  LinkChangeSuggestionProperties,
  BlockTypeChangeSuggestionProperties,
  IndentChangeSuggestionProperties,
} from './Types'
import type { Logger } from '@proton/utils/logs'
import { $isNonInlineLeafElement } from '../../Utils/isNonInlineLeafElement'

export function $rejectSuggestion(suggestionID: string, logger?: Logger): boolean {
  const nodes = $nodesOfType(ProtonNode)
  for (const node of nodes) {
    if (!$isSuggestionNode(node)) {
      continue
    }
    const nodeSuggestionID = node.getSuggestionIdOrThrow()
    if (nodeSuggestionID !== suggestionID) {
      continue
    }
    const suggestionType = node.getSuggestionTypeOrThrow()
    if (suggestionType === 'insert') {
      node.remove()
    } else if (suggestionType === 'delete') {
      $unwrapSuggestionNode(node)
    } else if (suggestionType === 'style-change') {
      const children = node.getChildren()
      $unwrapSuggestionNode(node)
      const changedProperties = node.getSuggestionChangedProperties()
      if (!changedProperties) {
        continue
      }
      for (const child of children) {
        if (!$isElementNode(child) && !$isTextNode(child)) {
          continue
        }
        const selectionToPatch = child.select(
          0,
          $isElementNode(child) ? child.getChildrenSize() : child.getTextContentSize(),
        )
        $patchStyleText(selectionToPatch, changedProperties)
      }
    } else if (suggestionType === 'property-change') {
      const children = node.getChildren()
      const changedProperties = node.getSuggestionChangedProperties<PropertyChangeSuggestionProperties>()
      if (!changedProperties) {
        $unwrapSuggestionNode(node)
        continue
      }
      for (const child of children) {
        for (const [key, value] of Object.entries(changedProperties)) {
          const writable = child.getWritable()
          ;(writable as any)[key] = value
        }
      }
      $unwrapSuggestionNode(node)
    } else if (suggestionType === 'split') {
      const parent = node.getParent()
      let parentNextSibling = parent?.getNextSibling<ElementNode>()
      node.remove()
      if (!$isElementNode(parent) || !$isElementNode(parentNextSibling)) {
        continue
      }
      const parentNextSiblingFirstChild = parentNextSibling.getFirstChild()
      if ($isListNode(parentNextSibling) && $isListItemNode(parentNextSiblingFirstChild)) {
        parentNextSibling = parentNextSiblingFirstChild
      }
      for (const child of parentNextSibling.getChildren()) {
        child.remove()
        parent.append(child)
      }
      parentNextSibling.remove()
    } else if (suggestionType === 'join') {
      node.remove()
    } else if (suggestionType === 'link-change') {
      const changedProperties = node.getSuggestionChangedProperties<LinkChangeSuggestionProperties>()
      if (!changedProperties) {
        node.remove()
        continue
      }
      const initialURL = changedProperties.__url
      const linkNode = node.getFirstChildOrThrow()
      const linkWasRemoved = !$isLinkNode(linkNode)
      if (linkWasRemoved) {
        if (initialURL) {
          const newLinkNode = $createLinkNode(initialURL)
          const children = node.getChildren()
          for (const child of children) {
            newLinkNode.append(child)
          }
          node.append(newLinkNode)
          $unwrapSuggestionNode(node)
        } else {
          node.remove()
        }
        continue
      }
      $unwrapSuggestionNode(node)
      if (initialURL) {
        linkNode.setURL(initialURL)
      } else {
        const children = linkNode.getChildren()
        for (const child of children) {
          linkNode.insertBefore(child)
        }
        linkNode.remove()
        continue
      }
    } else if (suggestionType === 'image-change') {
      const changedProperties = node.getSuggestionChangedProperties()
      if (!changedProperties) {
        node.remove()
        continue
      }
      const initialWidth = changedProperties.width
      const initialHeight = changedProperties.height
      const imageNode = node.getFirstChildOrThrow()
      $unwrapSuggestionNode(node)
      if (!$isImageNode(imageNode)) {
        continue
      }
      imageNode.setWidthAndHeight(initialWidth, initialHeight)
    } else if (suggestionType === 'indent-change') {
      const changedProperties = node.getSuggestionChangedProperties<IndentChangeSuggestionProperties>()
      if (!changedProperties) {
        node.remove()
        continue
      }
      const indentableParent = $findMatchingParent(
        node,
        (parentNode): parentNode is ElementNode =>
          $isElementNode(parentNode) && !parentNode.isInline() && parentNode.canIndent(),
      )
      node.remove()
      indentableParent?.setIndent(changedProperties.indent)
    } else if (suggestionType === 'insert-table') {
      const table = $findMatchingParent(node, $isTableNode)
      node.remove()
      if (table) {
        table.remove()
      }
    } else if (suggestionType === 'delete-table') {
      node.remove()
    } else if (suggestionType === 'insert-table-row' || suggestionType === 'duplicate-table-row') {
      const row = $findMatchingParent(node, $isTableRowNode)
      node.remove()
      if (row) {
        row.remove()
      }
    } else if (suggestionType === 'delete-table-row') {
      node.remove()
    } else if (suggestionType === 'insert-table-column' || suggestionType === 'duplicate-table-column') {
      const cell = $findMatchingParent(node, $isTableCellNode)
      node.remove()
      if (!cell) {
        continue
      }
      const cellIndex = cell.getIndexWithinParent()
      const table = $findMatchingParent(cell, $isTableNode)
      if (table) {
        $deleteTableColumn(table, cellIndex)
      }
    } else if (suggestionType === 'delete-table-column') {
      node.remove()
    } else if (suggestionType === 'block-type-change') {
      const block = $findMatchingParent(node, $isNonInlineLeafElement)
      if (!block) {
        node.remove()
        continue
      }
      node.remove()
      const changedProperties = node.getSuggestionChangedProperties<BlockTypeChangeSuggestionProperties>()
      if (!changedProperties || !block) {
        continue
      }
      const initialBlockType = changedProperties.initialBlockType
      const createInitialBlockTypeElement = blockTypeToCreateElementFn[initialBlockType]
      const formatType = changedProperties.initialFormatType || block.getFormatType()
      const indent = changedProperties.initialIndent || block.getIndent()
      const initialBlockTypeNode = createInitialBlockTypeElement()
      if (!$isCustomListNode(initialBlockTypeNode)) {
        initialBlockTypeNode.setFormat(formatType)
      }
      if (initialBlockTypeNode.canIndent()) {
        initialBlockTypeNode.setIndent(indent)
      }
      if ($isCustomListNode(initialBlockTypeNode) && changedProperties.listInfo) {
        const { listStyleType, listMarker } = changedProperties.listInfo
        if (listStyleType) {
          initialBlockTypeNode.setListStyleType(listStyleType)
        }
        if (listMarker) {
          initialBlockTypeNode.setMarker(listMarker)
        }
      }
      if ($isListItemNode(block) && $isCustomListNode(initialBlockTypeNode)) {
        const blockChildren = block.getChildren()
        const listItem = $createListItemNode(block.getChecked())
        for (const child of blockChildren) {
          child.remove()
          listItem.append(child)
        }
        block.replace(initialBlockTypeNode)
        initialBlockTypeNode.append(listItem)
      } else {
        block.replace(initialBlockTypeNode, true)
      }
      if ($isCustomListNode(initialBlockTypeNode)) {
        if (initialBlockTypeNode.getChildrenSize() === 0) {
          const emptyListItem = $createListItemNode()
          initialBlockTypeNode.append(emptyListItem)
        }
        for (const item of initialBlockTypeNode.getChildren()) {
          if (!$isListItemNode(item)) {
            continue
          }
          item.setFormat(formatType)
          item.setIndent(indent)
        }
      }
      initialBlockTypeNode.selectStart()
    } else if (suggestionType === 'align-change') {
      const elementParent = $findMatchingParent(node, (e): e is ElementNode => $isElementNode(e) && !e.isInline())
      node.remove()
      if (!elementParent) {
        continue
      }
      const changedProperties = node.getSuggestionChangedProperties<AlignChangeSuggestionProperties>()
      if (!changedProperties) {
        continue
      }
      const initialFormatType = changedProperties.initialFormatType
      elementParent.setFormat(initialFormatType)
    } else if (suggestionType === 'clear-formatting') {
      const children = node.getChildren()
      const changedProperties = node.getSuggestionChangedProperties()
      if (!changedProperties) {
        $unwrapSuggestionNode(node)
        continue
      }
      for (const node of children) {
        if (!$isTextNode(node)) {
          continue
        }
        node.setStyle(changedProperties.initialStyle)
        node.setFormat(changedProperties.initialFormat)
      }
      $unwrapSuggestionNode(node)
    } else {
      node.remove()
    }
  }
  return true
}
