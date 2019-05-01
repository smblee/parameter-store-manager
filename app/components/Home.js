// @flow
import React, { Component } from 'react';
import {
  Table,
  Breadcrumb,
  Button,
  Layout,
  Tree,
  Input,
  Typography,
  Alert,
  Spin
} from 'antd';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import ReactTimeAgo from 'react-time-ago';
import globToRegexp from 'glob-to-regexp';
import SearchTree from './SearchTree';
import {
  actions as parameterActions,
  selectors as parameterSelectors
} from '../ducks/parameters';
import CreationFormButton from './CreationFormButton';
import DeleteButton from './DeleteButton';
import localStore, { availableSettings } from '../store/localStore';
import SettingsButton from './SettingsButton';

const { TreeNode } = Tree;
const { Paragraph } = Typography;
const { Search } = Input;

const { Content, Footer, Sider } = Layout;

class Home extends Component {
  constructor(props) {
    super(props);
    const pathDelimiter = localStore.get(availableSettings.pathDelimiter);

    this.unsubscribeStore = localStore.onDidChange(
      availableSettings.pathDelimiter,
      (newValue, oldValue) => {
        if (newValue !== oldValue) this.setState({ pathDelimiter: newValue });
      }
    );

    this.state = {
      tableCursor: '',
      pathDelimiter
    };
  }

  stripTrailingPathDelimiter = str => {
    if (str.substr(-1) === this.state.pathDelimiter) {
      return str.substr(0, str.length - 1);
    }
    return str;
  };

  renderTreeNodes = data =>
    data.map(item => {
      if (item.children) {
        return (
          <TreeNode title={item.title} key={item.key} dataRef={item}>
            {this.renderTreeNodes(item.children)}
          </TreeNode>
        );
      }
      return <TreeNode {...item} />;
    });

  onTreeSelect = keys => {
    this.setState({ tableCursor: this.stripTrailingPathDelimiter(keys[0]) });
  };

  onTableFilterChange = e => {
    this.setState({ tableCursor: e.target.value });
  };

  componentDidMount() {
    this.props.fetchAllParameters();
  }

  componentWillUnmount() {
    this.unsubscribeStore();
  }

  render() {
    const {
      parameters,
      allParametersLoaded,
      allParametersLoading,
      allParametersErrored
    } = this.props;
    const { tableCursor, pathDelimiter } = this.state;
    const paramsToShowOnTable = tableCursor
      ? parameters.filter(param => {
          const reg = globToRegexp(`${tableCursor}*`);
          const d = reg.test(param.Name);
          return d;
        })
      : parameters;

    const columns = [
      {
        title: 'Name',
        dataIndex: 'Name',
        key: 'Name',
        width: 300,
        sorter: (a, b) => (a.Name < b.Name ? -1 : a.Name > b.Name ? 1 : 0),
        render: pathString => {
          const paths = pathString.split(pathDelimiter);
          const breadCrumbItems = paths.map((path, idx) => {
            const pathSoFar = paths.slice(0, idx + 1).join(pathDelimiter);

            // if last index
            if (idx === paths.length - 1) {
              return (
                <Breadcrumb.Item href="#" key={pathString + idx}>
                  <Paragraph strong copyable={{ text: pathString }}>
                    {path}
                  </Paragraph>
                </Breadcrumb.Item>
              );
            }
            return (
              <Breadcrumb.Item
                href="#"
                onClick={() => this.onTreeSelect([pathSoFar])}
                key={pathString + idx}
              >
                {path}
              </Breadcrumb.Item>
            );
          });

          return (
            <span style={{ wordBreak: 'break-word' }}>
              <Breadcrumb>{breadCrumbItems}</Breadcrumb>
            </span>
          );
        }
      },

      {
        title: 'Value',
        dataIndex: 'Value',
        key: 'Value',
        width: 300,

        render: value => (
          <Paragraph style={{ wordBreak: 'break-word' }} copyable>
            {value}
          </Paragraph>
        )
      },
      {
        title: 'Description',
        dataIndex: 'Description',
        key: 'Description',
        width: 250,
        render: value => {
          return value ? (
            <Paragraph style={{ wordBreak: 'break-word' }} copyable>
              {value}
            </Paragraph>
          ) : (
            <i>No Description</i>
          );
        }
      },
      {
        title: 'Type',
        dataIndex: 'Type',
        key: 'Type',
        width: 120
      },
      {
        title: 'LastModifiedDate',
        dataIndex: 'LastModifiedDate',
        key: 'LastModifiedDate',
        sorter: (a, b) =>
          new Date(a.LastModifiedDate) - new Date(b.LastModifiedDate),
        render: date => (
          <span>
            {<ReactTimeAgo date={date} />} ({date.toLocaleString()})
          </span>
        )
      },
      {
        title: 'Actions',
        key: 'Actions',
        width: 100,
        fixed: 'right',
        render: e => {
          const currentData = {
            name: e.Name,
            description: e.Description,
            type: e.Type,
            value: e.Value,
            kmsKey: e.KeyId
          };
          return (
            <Layout>
              <CreationFormButton
                buttonText="Edit"
                modalText="Edit"
                initialFormData={currentData}
                resetOnClose
                editFlow
              />
              <CreationFormButton
                buttonType="primary"
                buttonText="Duplicate"
                initialFormData={currentData}
                resetOnClose
              />
              <DeleteButton
                name={e.Name}
                onDelete={this.props.deleteParameter}
              />
            </Layout>
          );
        }
      }
    ];

    return (
      <Layout>
        <Content />
        <Content>
          <Layout style={{ background: '#fff' }}>
            <Sider
              width={300}
              style={{
                background: '#fff',
                overflow: 'auto',
                height: '100vh',
                left: 0
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    minHeight: '35px'
                  }}
                >
                  <SettingsButton />
                  <CreationFormButton
                    buttonType="primary"
                    style={{ flexGrow: 1, marginLeft: '20px' }}
                  />
                </div>
                {allParametersErrored || allParametersLoaded ? (
                  <SearchTree
                    data={parameters}
                    onTreeSelect={this.onTreeSelect}
                  />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      flex: '1 1 auto'
                    }}
                  >
                    <Spin tip="Loading and building parameter tree..." />
                  </div>
                )}
              </div>
            </Sider>
            <Content style={{ minHeight: '100%', width: '100%' }}>
              <Alert
                message={
                  <div>
                    {' '}
                    Last fetched:{' '}
                    {this.props.allParametersLastUpdatedDate ? (
                      <ReactTimeAgo
                        date={this.props.allParametersLastUpdatedDate}
                      />
                    ) : (
                      'Never'
                    )}
                    <span style={{ marginLeft: '10px' }}>
                      <Button
                        type="primary"
                        shape="circle"
                        icon="sync"
                        loading={allParametersLoading}
                        onClick={this.props.fetchAllParameters}
                      />
                    </span>
                  </div>
                }
                type="info"
              />
              <Search
                addonBefore={<span>Name filter. Supports globs (*, **).</span>}
                style={{ marginBottom: 8 }}
                placeholder="/services/**/Auth0"
                onChange={this.onTableFilterChange}
                value={this.state.tableCursor}
              />
              <Table
                dataSource={paramsToShowOnTable}
                columns={columns}
                scroll={{ x: 900, y: 'calc(100vh - 200px)' }}
                loading={allParametersLoading}
                className="your-table"
              />
            </Content>
          </Layout>
        </Content>
        <Footer style={{ textAlign: 'center' }}>Hopefully this helps</Footer>
      </Layout>
    );
  }
}

function mapStateToProps(state) {
  return {
    parameters: parameterSelectors.getAllParameters(state),
    allParametersLoaded: parameterSelectors.getIsAllParametersLoaded(state),
    allParametersLoading: parameterSelectors.getIsAllParametersLoading(state),
    allParametersErrored: parameterSelectors.getHasAllParametersErrored(state),
    allServiceNames: parameterSelectors.getAllServiceNames(state),
    allParametersLastUpdatedDate: parameterSelectors.getAllParametersLastUpdatedDate(
      state
    )
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(parameterActions, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Home);
