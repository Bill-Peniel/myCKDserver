
import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';
import { formatDate, getTimeAgo } from '@/lib/utils';

interface AlertsListProps {
  notifications: any[];
}

export function AlertsList({ notifications }: AlertsListProps) {
  return (
    <Card className="bg-white shadow rounded-lg">
      <CardHeader className="py-4 px-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-gray-900">
            Notifications récentes
          </CardTitle>
          <Link 
            href="/notifications" 
            className="text-sm font-medium text-primary hover:text-primary-dark"
          >
            Voir tout
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ul className="divide-y divide-gray-200">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <li key={notification._id}>
                <div className="px-6 py-4 flex items-center">
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center justify-center h-10 w-10 rounded-full ${
                      notification.isRead ? 'bg-gray-100' : 'bg-blue-100'
                    }`}>
                      <Bell className={`h-6 w-6 ${
                        notification.isRead ? 'text-gray-500' : 'text-blue-500'
                      }`} />
                    </span>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.message}
                      </p>
                      <p className="text-sm text-gray-500">
                        {getTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                    {notification.patientId?.user && (
                      <p className="text-xs text-gray-600 mt-1">
                        Patient: {notification.patientId.user.firstName} {notification.patientId.user.lastName}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="px-6 py-8 text-center">
              <p className="text-sm text-gray-500">Aucune notification</p>
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
