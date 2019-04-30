import React from 'react';
import { Tree, Input } from 'antd';
import * as filters from '../utils/filters';
import localStore, { availableSettings } from '../store/localStore';

const { TreeNode } = Tree;
const { Search } = Input;

export default class SearchTree extends React.Component {
  constructor(props) {
    super(props);

    const pathDelimiter = localStore.get(availableSettings.pathDelimiter);

    const searchTreeNodes = filters.pathsToTreeNodes(
      props.data.map(p => p.Name),
      pathDelimiter
    )[0];

    localStore.onDidChange(
      availableSettings.pathDelimiter,
      (newValue, oldValue) => {
        if (newValue !== oldValue) this.setState({ pathDelimiter: newValue });
      }
    );

    this.state = {
      expandedKeys: [],
      searchValue: '',
      filteredTreeRootNode: searchTreeNodes,
      treeRootNode: searchTreeNodes,
      pathDelimiter
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.props.data !== prevProps.data ||
      this.state.pathDelimiter !== prevState.pathDelimiter
    ) {
      const treeRootNode = filters.pathsToTreeNodes(
        this.props.data.map(p => p.Name),
        this.state.pathDelimiter
      )[0];
      this.setState(
        {
          treeRootNode
        },
        () =>
          // filter again with the new data
          this.onFilterChange({
            e: { target: { value: this.state.searchValue } }
          })
      );
    }
  }

  onExpand = expandedKeys => {
    this.setState({
      expandedKeys
    });
  };

  onFilterChange = e => {
    const filter = e.target && e.target.value.trim();
    if (!filter) {
      return this.setState({
        filteredTreeRootNode: this.state.treeRootNode,
        searchValue: '',
        expandedKeys: []
      });
    }

    let filtered = filters.filterTree(this.state.treeRootNode, filter);
    filtered = filters.expandFilteredNodes(filtered, filter);

    this.setState({
      filteredTreeRootNode: filtered.node,
      expandedKeys: filtered.keys,
      searchValue: filter
    });
  };

  render() {
    const { searchValue, expandedKeys, filteredTreeRootNode } = this.state;
    const { onTreeSelect } = this.props;
    const loop = nodes =>
      nodes.map(item => {
        const index = item.title
          .toLowerCase()
          .indexOf(searchValue.toLowerCase());
        const beforeStr = item.title.substr(0, index);
        const middleStr = item.title.substr(index, searchValue.length);
        const afterStr = item.title.substr(index + searchValue.length);

        const title =
          index > -1 ? (
            <span>
              {beforeStr}
              <span style={{ color: '#f50' }}>{middleStr}</span>
              {afterStr}
            </span>
          ) : (
            <span>{item.title}</span>
          );
        if (item.children) {
          return (
            <TreeNode key={item.key} title={title}>
              {loop(item.children)}
            </TreeNode>
          );
        }
        return <TreeNode key={item.key} title={title} />;
      });
    return (
      <div>
        <Search
          style={{ marginBottom: 8 }}
          placeholder={`Search Tree (${this.props.data.length} parameters)`}
          onChange={this.onFilterChange}
        />
        <Tree
          onExpand={this.onExpand}
          onSelect={onTreeSelect}
          expandedKeys={expandedKeys}
          checkStrictly
        >
          {loop(filteredTreeRootNode.children)}
        </Tree>
      </div>
    );
  }
}
