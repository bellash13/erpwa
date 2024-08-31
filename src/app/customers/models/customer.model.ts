export interface Customer {
  id: string; // Server ID or temporary local ID
  name: string;
  email: string;
  syncStatus?: 'created' | 'updated' | 'deleted'; // Sync status for tracking
  isTempId?: boolean; // Flag indicating if the ID is temporary
}
