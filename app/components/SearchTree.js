import React from 'react';
import PropTypes from 'prop-types';
import { Input, Tree } from 'antd';
import * as filters from '../utils/filters';
import localStore, { availableSettings } from '../store/localStore';

const { TreeNode } = Tree;
const { Search } = Input;

export default class SearchTree extends React.Component {
  static propTypes = {
    data: PropTypes.arrayOf().isRequired,
    onTreeSelect: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);

    const pathDelimiter = localStore.get(availableSettings.pathDelimiter);

    const searchTreeNodes = filters.pathsToTreeNodes(
      props.data.map(p => p.Name),
      pathDelimiter
    )[0];

    this.unsubscribeStore = localStore.onDidChange(
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
    const { data } = this.props;
    const { pathDelimiter, searchValue } = this.state;
    if (data !== prevProps.data || pathDelimiter !== prevState.pathDelimiter) {
      const treeRootNode = filters.pathsToTreeNodes(
        data.map(p => p.Name),
        pathDelimiter
      )[0];
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState(
        {
          treeRootNode
        },
        () =>
          // filter again with the new data
          this.onFilterChange({
            e: { target: { value: searchValue } }
          })
      );
    }
  }

  componentWillUnmount() {
    this.unsubscribeStore();
  }

  onExpand = expandedKeys => {
    this.setState({
      expandedKeys
    });
  };

  onFilterChange = e => {
    const filter = e.target && e.target.value.trim();
    const { treeRootNode } = this.state;
    if (!filter) {
      return this.setState({
        filteredTreeRootNode: treeRootNode,
        searchValue: '',
        expandedKeys: []
      });
    }

    let filtered = filters.filterTree(treeRootNode, filter);
    filtered = filters.expandFilteredNodes(filtered, filter);

    this.setState({
      filteredTreeRootNode: filtered.node,
      expandedKeys: filtered.keys,
      searchValue: filter
    });
  };

  render() {
    const { searchValue, expandedKeys, filteredTreeRootNode } = this.state;
    const { onTreeSelect, data } = this.props;
    const { length } = data;
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
          placeholder={`Search Tree (${length} parameters)`}
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
