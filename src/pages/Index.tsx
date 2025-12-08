import { useState } from 'react';
import { DataStoreProvider } from '@/contexts/DataStore';
import Layout from '@/components/Layout';
import TeamLeaderManagement from './TeamLeaderManagement';
import SalespersonManagement from './SalespersonManagement';
import UserManagement from './UserManagement';
import RechargeRecords from './RechargeRecords';
import ConsumeRecords from './ConsumeRecords';
import RoomBooking from './RoomBooking';

const Index = () => {
  const [currentPage, setCurrentPage] = useState('team-leaders');

  const renderPage = () => {
    switch (currentPage) {
      case 'team-leaders':
        return <TeamLeaderManagement />;
      case 'salespersons':
        return <SalespersonManagement />;
      case 'users':
        return <UserManagement />;
      case 'recharge':
        return <RechargeRecords />;
      case 'consume':
        return <ConsumeRecords />;
      case 'rooms':
        return <RoomBooking />;
      default:
        return <TeamLeaderManagement />;
    }
  };

  return (
    <DataStoreProvider>
      <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
        {renderPage()}
      </Layout>
    </DataStoreProvider>
  );
};

export default Index;
