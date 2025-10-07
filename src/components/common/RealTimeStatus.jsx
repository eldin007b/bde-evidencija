import React, { useState, useEffect } from 'react';
import { supabase } from '../../db/supabaseClient';

const RealTimeStatus = () => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOnlineUsers();
    
    // Refresh svakih 30 sekundi
    const interval = setInterval(fetchOnlineUsers, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchOnlineUsers = async () => {
    try {
      // Korisnici koji su bili aktivni u zadnjih 10 minuta
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('drivers')
        .select('ime, tura, last_login, device_id')
        .gte('last_login', tenMinutesAgo.toISOString())
        .eq('aktivan', true)
        .order('last_login', { ascending: false });

      if (error) throw error;
      
      setOnlineUsers(data || []);
    } catch (error) {
      console.error('Error fetching online users:', error);
      setOnlineUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (lastLogin) => {
    const now = new Date();
    const loginTime = new Date(lastLogin);
    const diffMinutes = Math.floor((now - loginTime) / (1000 * 60));
    
    if (diffMinutes <= 5) return '#28a745'; // Green - Very active
    if (diffMinutes <= 15) return '#ffc107'; // Yellow - Recently active
    return '#6c757d'; // Gray - Idle
  };

  const getTimeAgo = (lastLogin) => {
    const now = new Date();
    const loginTime = new Date(lastLogin);
    const diffMinutes = Math.floor((now - loginTime) / (1000 * 60));
    
    if (diffMinutes < 1) return 'sada';
    if (diffMinutes < 60) return `${diffMinutes}min`;
    const hours = Math.floor(diffMinutes / 60);
    return `${hours}h`;
  };

  if (loading) {
    return (
      <div style={{
        background: '#ffffff',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #e0e0e0',
        marginBottom: '24px'
      }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          Učitavam status...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: '#ffffff',
      padding: '20px',
      borderRadius: '12px',
      border: '1px solid #e0e0e0',
      marginBottom: '24px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '20px', marginRight: '8px' }}>👥</span>
          <h3 style={{ 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: 'bold',
            color: '#333'
          }}>
            Tim Status
          </h3>
          <span style={{
            background: '#28a745',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 'bold',
            marginLeft: '8px'
          }}>
            {onlineUsers.length} online
          </span>
        </div>
        <button
          onClick={fetchOnlineUsers}
          style={{
            background: 'none',
            border: '1px solid #ddd',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '12px',
            cursor: 'pointer',
            color: '#666'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {onlineUsers.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: '#666',
          padding: '20px',
          fontStyle: 'italic'
        }}>
          Nema aktivnih korisnika u zadnjih 10 minuta
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gap: '12px'
        }}>
          {onlineUsers.map((user, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: getStatusColor(user.last_login)
                  }}
                />
                <div>
                  <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: '14px',
                    color: '#333'
                  }}>
                    {user.ime}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#666' 
                  }}>
                    {user.tura}
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666',
                textAlign: 'right'
              }}>
                <div>{getTimeAgo(user.last_login)}</div>
                {user.device_id && (
                  <div style={{ fontSize: '10px', color: '#999' }}>
                    {user.device_id.substring(0, 8)}...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RealTimeStatus;