import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Empty, Table, Tag } from 'antd';
import dayjs from 'dayjs';

import Api from '../helpers/core/Api';
import AuthContext from '../helpers/core/AuthContext';
import ContentPanel from '../components/core/layout/ContentPanel';

const formatAmount = amount =>
  new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount || 0);

const Entries = () => {
  const { logged } = useContext(AuthContext);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const columns = useMemo(
    () => [
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
      }
    ],
    []
  );

  return (
    <ContentPanel title="Movimenti" loading={loading && entries.length === 0}>
      {error && <Alert className="mb-4" type="error" message={error} showIcon />}
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={entries}
        loading={loading}
        pagination={false}
        locale={{ emptyText: <Empty description="Nessun movimento" /> }}
      />
    </ContentPanel>
  );
};

export default Entries;
