import React from 'react';
import TabBar from '../../../components/common/TabBar';

const AdminTabBar = ({ tabs, activeTab, onChange }) => (
  <TabBar tabs={tabs} activeTab={activeTab} onChange={onChange} />
);

export default AdminTabBar;
