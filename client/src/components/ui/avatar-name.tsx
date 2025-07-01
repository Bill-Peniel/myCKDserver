import React from 'react';
import { cn, getAvatarColor } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface AvatarNameProps {
  firstName: string;
  lastName: string;
  initials?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  showEmail?: boolean;
  email?: string;
  gender?: 'M' | 'F' | 'Autre';
}

export function AvatarName({
  firstName,
  lastName,
  initials,
  className,
  size = 'md',
  showName = true,
  showEmail = false,
  email,
  gender,
}: AvatarNameProps) {
  const displayInitials = initials || 
    (firstName && lastName ? `${firstName[0]}${lastName[0]}` : 'U');
  const avatarColor = getAvatarColor(displayInitials);

  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-lg',
    lg: 'h-12 w-12 text-xl'
  };

  return (
    <div className={cn('flex items-center', className)}>
      {gender && (
        <span className="text-gray-500 mr-1">
          {gender === 'M' ? '♂' : gender === 'F' ? '♀' : '⚧'}
        </span>
      )}
      <Avatar className={cn('flex-shrink-0', sizeClasses[size])}>
        <AvatarFallback className={cn('font-medium', avatarColor)}>
          {displayInitials}
        </AvatarFallback>
      </Avatar>

      {showName && (
        <div className="ml-4">
          <div className="text-sm font-medium text-gray-900">
            {firstName} {lastName}
          </div>
          {showEmail && email && (
            <div className="text-sm text-gray-500">{email}</div>
          )}
        </div>
      )}
    </div>
  );
}