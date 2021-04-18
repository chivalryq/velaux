import {
  addApplication,
  listApplications,
  removeApplication,
  updateApplication,
} from '@/services/kubevela/applicationapi';
import { listClusterNames } from '@/services/kubevela/clusterapi';
import { PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import type { ActionType, ProColumns } from '@ant-design/pro-table';
import ProTable from '@ant-design/pro-table';
import { Button, message, Space, Tooltip } from 'antd';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import { FormattedMessage, Link } from 'umi';
import InputForm from './InputForm';

interface UpdateState {
  visible: boolean;
  value?: API.ApplicationType;
}

const ApplicationList = () => {
  const [createModalVisible, handleCreateModalVisible] = useState<boolean>(false);
  const [updateModal, handleUpdateModal] = useState<UpdateState>({ visible: false });
  const [clusterNames, setClusterNames] = useState<string[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<string>('');

  let clusterEnum = {};
  clusterNames.forEach((value) => {
    clusterEnum[value] = { text: value };
  });

  const actionRef = useRef<ActionType>();

  const handleAdd = async (fields: API.ApplicationType) => {
    const hide = message.loading('Adding');
    try {
      await addApplication(selectedCluster, { ...fields });
      hide();
      message.success('Added successfully');
      return true;
    } catch (error) {
      hide();
      message.error('Failed to add; retry again!');
      return false;
    }
  };

  const handleUpdate = async (val: API.ApplicationType) => {
    const hide = message.loading('Updating');
    try {
      const newVal = await updateApplication(selectedCluster, val);
      handleUpdateModal({ ...updateModal, value: newVal.application });
      hide();
      message.success('Updated successfully');
      return true;
    } catch (error) {
      hide();
      message.error('Failed to update; retry again!');
      return false;
    }
  };

  useEffect(() => {
    listClusterNames().then((resp) => {
      setClusterNames(resp.clusters);
    });
  }, []);

  const handleRemove = async (val: API.ApplicationType) => {
    const hide = message.loading('Deleting');
    try {
      await removeApplication(selectedCluster, val);
      hide();
      message.success('Deleted successfully');
      return true;
    } catch (error) {
      hide();
      message.error('Failed to delete; retry again!');
      return false;
    }
  };

  const columns: ProColumns<API.ApplicationType>[] = [
    {
      title: 'Index',
      dataIndex: 'index',
      valueType: 'indexBorder',
      width: 48,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      render: (dom, entity) => (
        // https://stackoverflow.com/questions/41736048/what-is-a-state-in-link-component-of-react-router
        // https://reactrouter.com/web/api/Link
        // use props.match.params.appName and props.location.state.app
        <Link to={{ pathname: `/clusters/${selectedCluster}/applications/${entity.name}` }}>
          <a>{dom}</a>
        </Link>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'desc',
      search: false,
    },
    {
      title: (
        <>
          Last Updated
          <Tooltip placement="top" title="Last updated time">
            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </>
      ),
      search: false,
      dataIndex: 'updatedAt',
      valueType: 'date',
      sorter: (a, b) => {
        if (a.updatedAt && b.updatedAt) {
          return a.updatedAt - b.updatedAt;
        }
        return 0;
      },
      render: (_, record) => {
        if (record.updatedAt) {
          return moment(record.updatedAt).format('YYYY-MM-DD');
        }
        return '';
      },
    },
    {
      title: <FormattedMessage id="pages.table.titleOption" defaultMessage="Option" />,
      width: '164px',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => (
        <Space>
          <Button
            id="edit"
            type="primary"
            onClick={() => {
              handleUpdateModal({ visible: true, value: record });
            }}
          >
            <FormattedMessage id="pages.table.edit" defaultMessage="Edit" />
          </Button>
          <Button
            id="delete"
            type="primary"
            danger
            onClick={() => {
              handleRemove(record);
              actionRef.current?.reloadAndRest?.();
            }}
          >
            <FormattedMessage id="pages.table.delete" defaultMessage="Delete" />
          </Button>
        </Space>
      ),
    },
  ];

  if (clusterNames.length > 0) {
    columns.unshift({
      title: 'Cluster',
      dataIndex: 'cluster',
      hideInTable: true,
      filters: true,
      onFilter: true,
      valueType: 'select',
      initialValue: clusterNames[0],
      valueEnum: clusterEnum,
    });
  }

  return (
    <PageContainer loading={clusterNames.length == 0}>
      <ProTable<API.ApplicationType>
        columns={columns}
        rowKey="key"
        dateFormatter="string"
        headerTitle="Table"
        actionRef={actionRef}
        pagination={{
          showQuickJumper: true,
        }}
        search={{
          // filterType: 'light',
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Button
            type="primary"
            key="primary"
            onClick={() => {
              handleCreateModalVisible(true);
            }}
          >
            <PlusOutlined /> <FormattedMessage id="pages.table.new" defaultMessage="New" />
          </Button>,
        ]}
        request={async (params, sorter, filter) => {
          setSelectedCluster(params.cluster);
          let resp = await listApplications(params.cluster);
          let apps = resp.applications;

          if (params.name) {
            apps = apps.filter((val) => val.name?.includes(params.name));
          }
          return Promise.resolve({
            data: apps,
            success: true,
          });
        }}
      />

      <InputForm
        title={'Create Application'}
        visible={createModalVisible}
        onFinish={async (value: any) => {
          const success = await handleAdd(value as API.ApplicationType);
          if (success) {
            handleCreateModalVisible(false);
            if (actionRef.current) {
              actionRef.current.reload();
            }
          }

          message.success('提交成功');
          return true;
        }}
        onVisibleChange={async (visible) => {
          handleCreateModalVisible(visible);
        }}
      />

      <InputForm
        title={'Update Application'}
        visible={updateModal.visible}
        onFinish={async (value: any) => {
          const success = await handleUpdate(value as API.ApplicationType);
          if (success) {
            handleUpdateModal({ ...updateModal, visible: false });
            if (actionRef.current) {
              actionRef.current.reload();
            }
          }

          message.success('提交成功');
          return true;
        }}
        onVisibleChange={async (visible) => {
          handleUpdateModal({ ...updateModal, visible });
        }}
        initialValues={updateModal.value}
      />
    </PageContainer>
  );
};

export default ApplicationList;
