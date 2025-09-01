import React from 'react';
import { User } from '../types';
import { MASTER_USER_EMAIL } from '../constants';

interface UserListProps {
  users: User[];
  onInitiateToggleStatus: (user: User) => void;
  onInitiateDeleteUser: (user: User) => void;
  pendingAction: { user: User; action: 'toggleStatus' | 'delete' } | null;
  onConfirmAction: () => void;
  onCancelAction: () => void;
}

const UserList: React.FC<UserListProps> = ({ 
    users, 
    onInitiateToggleStatus, 
    onInitiateDeleteUser,
    pendingAction,
    onConfirmAction,
    onCancelAction
}) => {
  if (users.length === 0) {
    return <p className="text-slate-500">No users found.</p>;
  }

  return (
    <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
      {users.map((user) => {
        const isMaster = user.email === MASTER_USER_EMAIL;
        const isPendingAction = pendingAction?.user.uid === user.uid;
        
        return (
          <div
            key={user.uid}
            className={`p-3 rounded-md transition-colors border ${isPendingAction ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}
          >
            <div>
              <div className="flex justify-between items-center">
                <p className="font-medium">{user.displayName || 'No Name'}</p>
                <span
                  className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {user.status}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                {user.email}
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-end space-x-2">
            {isPendingAction ? (
                <>
                    <span className="text-xs font-medium text-slate-700">Are you sure?</span>
                    <button
                        onClick={onConfirmAction}
                        className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                    >
                        Confirm
                    </button>
                    <button
                        onClick={onCancelAction}
                        className="px-3 py-1 text-xs font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300"
                    >
                        Cancel
                    </button>
                </>
            ) : (
                <>
                    <button
                        onClick={() => onInitiateToggleStatus(user)}
                        disabled={isMaster}
                        className="px-3 py-1 text-xs font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-amber-100 text-amber-800 hover:bg-amber-200"
                    >
                        {user.status === 'active' ? 'Block' : 'Unblock'}
                    </button>
                    <button
                        onClick={() => onInitiateDeleteUser(user)}
                        disabled={isMaster}
                        className="px-3 py-1 text-xs font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-red-100 text-red-800 hover:bg-red-200"
                    >
                        Delete
                    </button>
                </>
            )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UserList;