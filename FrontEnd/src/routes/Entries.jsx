import { useCallback, useContext, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  DatePicker,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag
} from 'antd';
import dayjs from 'dayjs';

import Api from '../helpers/core/Api';
import AuthContext from '../helpers/core/AuthContext';
import MessageContext from '../helpers/core/MessageContext';
import ContentPanel from '../components/core/layout/ContentPanel';

const formatAmount = amount =>
  new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount || 0);

const Entries = () => {
  const { logged } = useContext(AuthContext);
  const { loadingMsg, savedMsg, errorMsg } = useContext(MessageContext);
  const [form] = Form.useForm();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [error, setError] = useState(null);

  const companyId = logged?.company?.id;

  const loadEntries = useCallback(() => {
    if (!companyId) return Promise.resolve();

    setLoading(true);
    setError(null);

    return Api.get(`/companies/${companyId}/entries?sorter=-date`)
      .then(res => setEntries(res.data))
      .catch(err => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [companyId]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const openCreate = () => {
    setEditingEntry(null);
    form.resetFields();
    form.setFieldsValue({ type: 'expense', date: dayjs() });
    setModalOpen(true);
  };

  const openEdit = record => {
    setEditingEntry(record);
    form.setFieldsValue({
      ...record,
      date: record.date ? dayjs(record.date) : null
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingEntry(null);
    form.resetFields();
  };

  const handleSave = values => {
    const msg = loadingMsg();
    const payload = {
      ...values,
      date: values.date.format('YYYY-MM-DD')
    };

    setSaving(true);

    const request = editingEntry
      ? Api.patch(`/companies/${companyId}/entries/${editingEntry._id}`, payload)
      : Api.post(`/companies/${companyId}/entries`, payload);

    return request
      .then(() => loadEntries())
      .then(() => {
        savedMsg(msg);
        closeModal();
      })
      .catch(err => errorMsg(msg, err))
      .finally(() => setSaving(false));
  };

  const handleDelete = record => {
    const msg = loadingMsg();
    setDeletingId(record._id);

    return Api.delete(`/companies/${companyId}/entries/${record._id}`)
      .then(() => loadEntries())
      .then(() => savedMsg(msg))
      .catch(err => errorMsg(msg, err))
      .finally(() => setDeletingId(null));
  };

  const columns = [
    {
      title: 'Data',
      dataIndex: 'date',
      key: 'date',
      render: value => (value ? dayjs(value).format('DD/MM/YYYY') : '')
    },
    {
      title: 'Tipo',
      dataIndex: 'type',
      key: 'type',
      render: value => (
        <Tag color={value === 'income' ? 'green' : 'red'}>{value === 'income' ? 'Entrata' : 'Uscita'}</Tag>
      )
    },
    {
      title: 'Importo',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: value => formatAmount(value)
    },
    {
      title: 'Categoria',
      dataIndex: 'category',
      key: 'category'
    },
    {
      title: 'Descrizione',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'Azioni',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEdit(record)}>
            Modifica
          </Button>
          <Popconfirm
            title="Sicuro di voler cancellare questo movimento?"
            okText="Si"
            cancelText="No"
            onConfirm={() => handleDelete(record)}
          >
            <Button danger size="small" loading={deletingId === record._id}>
              Cancella
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <ContentPanel
      title="Movimenti"
      loading={loading && entries.length === 0}
      titleAction={
        <Button type="primary" onClick={openCreate}>
          Nuovo movimento
        </Button>
      }
    >
      {error && <Alert className="mb-4" type="error" message={error} showIcon />}
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={entries}
        loading={loading}
        pagination={false}
        locale={{ emptyText: <Empty description="Nessun movimento" /> }}
      />
      <Modal
        title={editingEntry ? 'Modifica movimento' : 'Nuovo movimento'}
        open={modalOpen}
        onOk={() => form.submit()}
        onCancel={closeModal}
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="type" label="Tipo" rules={[{ required: true, message: 'Campo obbligatorio' }]}>
            <Select
              options={[
                { value: 'income', label: 'Entrata' },
                { value: 'expense', label: 'Uscita' }
              ]}
            />
          </Form.Item>
          <Form.Item name="amount" label="Importo" rules={[{ required: true, message: 'Campo obbligatorio' }]}>
            <InputNumber className="w-full" min={0.01} step={0.01} />
          </Form.Item>
          <Form.Item name="date" label="Data" rules={[{ required: true, message: 'Campo obbligatorio' }]}>
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="category" label="Categoria" rules={[{ required: true, message: 'Campo obbligatorio' }]}>
            <Input maxLength={128} />
          </Form.Item>
          <Form.Item name="description" label="Descrizione">
            <Input.TextArea rows={3} maxLength={512} />
          </Form.Item>
        </Form>
      </Modal>
    </ContentPanel>
  );
};

export default Entries;
