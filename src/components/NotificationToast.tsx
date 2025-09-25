import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: Date;
}

interface NotificationToastProps {
  notifications: Notification[];
}

export function NotificationToast({ notifications }: NotificationToastProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => {
        const Icon = notification.type === 'success' ? CheckCircle : 
                    notification.type === 'error' ? XCircle : Info;
        
        const bgColor = notification.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                       notification.type === 'error' ? 'bg-gradient-to-r from-red-500 to-pink-500' :
                       'bg-gradient-to-r from-blue-500 to-cyan-500';

        return (
          <div
            key={notification.id}
            className={`${bgColor} text-white p-4 rounded-lg shadow-lg flex items-center space-x-3 min-w-80 animate-in slide-in-from-right duration-300`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <p className="flex-1 font-medium">{notification.message}</p>
            <button className="text-white/80 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}