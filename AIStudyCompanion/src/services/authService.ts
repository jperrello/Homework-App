import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

export interface UserAccount {
  id: string;
  username: string;
  canvasUrl: string;
  createdAt: string;
  lastLogin: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: UserAccount;
}

export interface StoredAccounts {
  [userId: string]: UserAccount;
}

class AuthService {
  private static readonly ACCOUNTS_KEY = 'user_accounts';
  private static readonly CURRENT_USER_KEY = 'current_user_id';
  private static readonly DEV_MODE_KEY = 'dev_mode_enabled';
  
  // Password hashing using expo-crypto
  private async hashPassword(password: string, salt: string): Promise<string> {
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password + salt
    );
  }

  // Generate unique salt
  private async generateSalt(): Promise<string> {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Generate secure storage key for user's Canvas credentials
  private getCanvasCredentialsKey(userId: string): string {
    return `canvas_creds_${userId}`;
  }

  private getPasswordKey(userId: string): string {
    return `password_${userId}`;
  }

  private getSaltKey(userId: string): string {
    return `salt_${userId}`;
  }

  // Store Canvas credentials securely
  private async storeCanvasCredentials(userId: string, canvasUrl: string, accessToken: string): Promise<void> {
    const credentials = JSON.stringify({ canvasUrl, accessToken });
    await SecureStore.setItemAsync(this.getCanvasCredentialsKey(userId), credentials);
  }

  // Retrieve Canvas credentials securely
  private async getCanvasCredentials(userId: string): Promise<{ canvasUrl: string; accessToken: string } | null> {
    try {
      const credentials = await SecureStore.getItemAsync(this.getCanvasCredentialsKey(userId));
      return credentials ? JSON.parse(credentials) : null;
    } catch (error) {
      console.error('Error retrieving Canvas credentials:', error);
      return null;
    }
  }

  // Get all stored accounts (metadata only, no credentials)
  private async getStoredAccounts(): Promise<StoredAccounts> {
    try {
      const accountsJson = await SecureStore.getItemAsync(AuthService.ACCOUNTS_KEY);
      return accountsJson ? JSON.parse(accountsJson) : {};
    } catch (error) {
      console.error('Error retrieving stored accounts:', error);
      return {};
    }
  }

  // Store account metadata
  private async storeAccounts(accounts: StoredAccounts): Promise<void> {
    await SecureStore.setItemAsync(AuthService.ACCOUNTS_KEY, JSON.stringify(accounts));
  }

  // Create new user account
  async createAccount(username: string, password: string, canvasUrl: string, accessToken: string): Promise<AuthResult> {
    try {
      const accounts = await this.getStoredAccounts();
      
      // Check if username already exists
      const existingUser = Object.values(accounts).find(account => account.username.toLowerCase() === username.toLowerCase());
      if (existingUser) {
        return { success: false, error: 'Username already exists' };
      }

      // Generate user ID and password hash
      const userId = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, username + Date.now().toString());
      const salt = await this.generateSalt();
      const hashedPassword = await this.hashPassword(password, salt);

      // Create user account
      const userAccount: UserAccount = {
        id: userId,
        username,
        canvasUrl,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      // Store account metadata
      accounts[userId] = userAccount;
      await this.storeAccounts(accounts);

      // Store password and salt securely
      await SecureStore.setItemAsync(this.getPasswordKey(userId), hashedPassword);
      await SecureStore.setItemAsync(this.getSaltKey(userId), salt);

      // Store Canvas credentials securely
      await this.storeCanvasCredentials(userId, canvasUrl, accessToken);

      // Set as current user
      await SecureStore.setItemAsync(AuthService.CURRENT_USER_KEY, userId);

      return { success: true, user: userAccount };
    } catch (error) {
      console.error('Error creating account:', error);
      return { success: false, error: 'Failed to create account' };
    }
  }

  // Login with username and password
  async login(username: string, password: string): Promise<AuthResult> {
    try {
      const accounts = await this.getStoredAccounts();
      
      // Find user by username
      const userAccount = Object.values(accounts).find(account => account.username.toLowerCase() === username.toLowerCase());
      if (!userAccount) {
        return { success: false, error: 'User not found' };
      }

      // Verify password
      const storedPasswordHash = await SecureStore.getItemAsync(this.getPasswordKey(userAccount.id));
      const salt = await SecureStore.getItemAsync(this.getSaltKey(userAccount.id));
      
      if (!storedPasswordHash || !salt) {
        return { success: false, error: 'Account data corrupted' };
      }

      const providedPasswordHash = await this.hashPassword(password, salt);
      if (storedPasswordHash !== providedPasswordHash) {
        return { success: false, error: 'Invalid password' };
      }

      // Update last login
      userAccount.lastLogin = new Date().toISOString();
      accounts[userAccount.id] = userAccount;
      await this.storeAccounts(accounts);

      // Set as current user
      await SecureStore.setItemAsync(AuthService.CURRENT_USER_KEY, userAccount.id);

      return { success: true, user: userAccount };
    } catch (error) {
      console.error('Error during login:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  // Get current logged-in user
  async getCurrentUser(): Promise<UserAccount | null> {
    try {
      const currentUserId = await SecureStore.getItemAsync(AuthService.CURRENT_USER_KEY);
      if (!currentUserId) return null;

      const accounts = await this.getStoredAccounts();
      return accounts[currentUserId] || null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Get Canvas credentials for current user
  async getCurrentUserCanvasCredentials(): Promise<{ canvasUrl: string; accessToken: string } | null> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) return null;

    return this.getCanvasCredentials(currentUser.id);
  }

  // Logout current user
  async logout(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(AuthService.CURRENT_USER_KEY);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  // Check if user is logged in
  async isLoggedIn(): Promise<boolean> {
    const currentUser = await this.getCurrentUser();
    return currentUser !== null;
  }

  // Get all usernames (for development/debugging)
  async getAllUsernames(): Promise<string[]> {
    const accounts = await this.getStoredAccounts();
    return Object.values(accounts).map(account => account.username);
  }

  // Development methods for token management
  async enableDevMode(): Promise<void> {
    await SecureStore.setItemAsync(AuthService.DEV_MODE_KEY, 'true');
  }

  async disableDevMode(): Promise<void> {
    await SecureStore.deleteItemAsync(AuthService.DEV_MODE_KEY);
  }

  async isDevModeEnabled(): Promise<boolean> {
    const devMode = await SecureStore.getItemAsync(AuthService.DEV_MODE_KEY);
    return devMode === 'true';
  }

  // Clear all stored data (DEVELOPMENT ONLY)
  async clearAllData(): Promise<void> {
    try {
      const accounts = await this.getStoredAccounts();
      
      // Delete all user credentials
      for (const userId of Object.keys(accounts)) {
        await SecureStore.deleteItemAsync(this.getCanvasCredentialsKey(userId));
        await SecureStore.deleteItemAsync(this.getPasswordKey(userId));
        await SecureStore.deleteItemAsync(this.getSaltKey(userId));
      }

      // Delete account metadata
      await SecureStore.deleteItemAsync(AuthService.ACCOUNTS_KEY);
      await SecureStore.deleteItemAsync(AuthService.CURRENT_USER_KEY);
      await SecureStore.deleteItemAsync(AuthService.DEV_MODE_KEY);

      console.log('All stored data cleared');
    } catch (error) {
      console.error('Error clearing data:', error);
      throw new Error('Failed to clear all data');
    }
  }

  // Delete specific user account (DEVELOPMENT ONLY)
  async deleteAccount(username: string): Promise<boolean> {
    try {
      const accounts = await this.getStoredAccounts();
      const userAccount = Object.values(accounts).find(account => account.username.toLowerCase() === username.toLowerCase());
      
      if (!userAccount) {
        return false;
      }

      // Delete credentials
      await SecureStore.deleteItemAsync(this.getCanvasCredentialsKey(userAccount.id));
      await SecureStore.deleteItemAsync(this.getPasswordKey(userAccount.id));
      await SecureStore.deleteItemAsync(this.getSaltKey(userAccount.id));

      // Remove from accounts
      delete accounts[userAccount.id];
      await this.storeAccounts(accounts);

      // If this was the current user, logout
      const currentUserId = await SecureStore.getItemAsync(AuthService.CURRENT_USER_KEY);
      if (currentUserId === userAccount.id) {
        await this.logout();
      }

      return true;
    } catch (error) {
      console.error('Error deleting account:', error);
      return false;
    }
  }

  // Get account statistics (DEVELOPMENT ONLY)
  async getAccountStats(): Promise<{
    totalAccounts: number;
    accounts: { username: string; createdAt: string; lastLogin: string }[];
  }> {
    const accounts = await this.getStoredAccounts();
    return {
      totalAccounts: Object.keys(accounts).length,
      accounts: Object.values(accounts).map(account => ({
        username: account.username,
        createdAt: account.createdAt,
        lastLogin: account.lastLogin,
      })),
    };
  }
}

export default new AuthService();