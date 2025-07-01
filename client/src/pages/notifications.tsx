import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Bell, Check, Search, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Loader } from '@/components/ui/loader';
import { Notification } from '@/lib/types';
import { formatDate, getTimeAgo } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

export default function NotificationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showRead, setShowRead] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const notificationsPerPage = 10;

  const { data, isLoading } = useQuery<{ notifications: Notification[] }>({
    queryKey: ['/api/notifications'],
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('POST', `/api/notifications/mark-read/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to mark notification as read',
        variant: 'destructive',
      });
    }
  });


  const handleMarkAsRead = (_id: string) => {
    if (!_id) {
      console.error('Notification _id is undefined');
      return;
    }
    markAsReadMutation.mutate(_id);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiRequest('POST', '/api/notifications/mark-all-read', {});

      // Refresh notifications
      await queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });

      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive',
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset to first page when searching
    setCurrentPage(1);
  };

  // Filter notifications based on search and show/hide read
  const filteredNotifications = data?.notifications.filter(notification => {
    const matchesSearch = searchQuery
      ? notification.message.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    // Show read notifications when showRead is true, unread when false
    const matchesReadFilter = showRead ? notification.isRead : !notification.isRead;

    return matchesSearch && matchesReadFilter;
  }) || [];

  // Sort by date (newest first)
  const sortedNotifications = [...filteredNotifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Calculate pagination
  const totalPages = Math.ceil(sortedNotifications.length / notificationsPerPage);
  const startIndex = (currentPage - 1) * notificationsPerPage;
  const paginatedNotifications = sortedNotifications.slice(startIndex, startIndex + notificationsPerPage);

  const hasUnreadNotifications = data?.notifications?.some(notification => !notification.isRead);

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
        {hasUnreadNotifications && (
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleMarkAllAsRead}
          >
            <Check className="h-4 w-4" />
            <span>Mark All as Read</span>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Notification Center</CardTitle>
              <CardDescription>
                Stay updated with patient and system alerts
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <form onSubmit={handleSearch} className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search notifications..."
                  className="pl-8 w-full sm:w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>

              <div className="flex items-center space-x-2">
                <Switch
                  id="show-read"
                  checked={showRead}
                  onCheckedChange={setShowRead}
                />
                <Label htmlFor="show-read">Show read notifications</Label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-96 flex items-center justify-center">
              <Loader size="lg" />
            </div>
          ) : paginatedNotifications.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center text-gray-500">
              <Bell className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium">No notifications</h3>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 border rounded-lg transition-colors ${
                      notification.isRead ? 'bg-white' : 'bg-blue-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className={`rounded-full p-2 ${
                          notification.severity === "dfg" 
                          ? 'bg-purple-100' 
                          : notification.isRead 
                            ? 'bg-gray-100' 
                            : 'bg-blue-100'
                        }`}>
                          <Bell className={`h-5 w-5 ${
                            notification.severity === "dfg"
                            ? 'text-purple-500'
                            : notification.isRead 
                              ? 'text-gray-500' 
                              : 'text-blue-500'
                          }`} />
                        </div>
                        <div>
                          <p className="text-sm text-gray-900">{notification.message}</p>
                          {notification.patientId?.user && (
                            <p className="text-xs text-gray-600 mt-1">
                              Patient: {notification.patientId.user.firstName} {notification.patientId.user.lastName}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {getTimeAgo(notification.createdAt)} ({formatDate(notification.createdAt)})
                          </p>
                        </div>
                      </div>
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification._id)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-gray-500">
                    Showing {startIndex + 1} to {Math.min(startIndex + notificationsPerPage, filteredNotifications.length)} of {filteredNotifications.length} notifications
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>

                      {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                        const page = i + 1;
                        return (
                          <PaginationItem key={i}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <PaginationItem>
                          <span className="flex h-9 w-9 items-center justify-center">...</span>
                        </PaginationItem>
                      )}

                      {totalPages > 5 && (
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => setCurrentPage(totalPages)}
                            isActive={currentPage === totalPages}
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      )}

                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}