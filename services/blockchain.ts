import { StudentCertificate, UserProfile, UserRole, VerificationLog, StudentUpload } from '../types';
import { get, set } from 'idb-keyval';

/**
 * MOCK BLOCKCHAIN SERVICE & DATABASE
 * Manages persistence for multiple roles using IndexedDB (via idb-keyval).
 * This avoids the 5MB LocalStorage limit for large certificate images.
 */

const KEYS = {
  CERTIFICATES: 'cv_ledger_certs',
  USERS: 'cv_users',
  VERIFICATION_LOGS: 'cv_verification_logs',
  STUDENT_UPLOADS: 'cv_student_uploads'
};

const DELAY_MS = 800; // Simulated latency

// --- Helpers ---
const getStorage = async <T>(key: string): Promise<T[]> => {
  try {
    const data = await get(key);
    if (data) return data as T[];
    
    // Fallback/Migration from localStorage
    const legacyData = localStorage.getItem(key);
    if (legacyData) {
      const parsed = JSON.parse(legacyData);
      await set(key, parsed);
      localStorage.removeItem(key);
      return parsed;
    }
  } catch (e) {
    console.error("Storage read error", e);
  }
  return [];
};

const setStorage = async <T>(key: string, data: T[]) => {
  try {
    await set(key, data);
  } catch (e) {
    console.error("Storage write error", e);
    alert("Critical: Storage error. The image might be too large even for IndexedDB, or disk space is low.");
  }
};

const generateWalletAddress = () => {
  return '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('');
};

export const blockchainService = {
  
  // --- AUTHENTICATION ---
  
  login: async (role: UserRole, name: string, extraId?: string): Promise<UserProfile> => {
    const users = await getStorage<UserProfile>(KEYS.USERS);
    
    return new Promise((resolve) => {
      setTimeout(async () => {
        // Simple mock login: if name matches, return user, else create new
        let user = users.find(u => u.name.toLowerCase() === name.toLowerCase() && u.role === role);
        
        if (!user) {
          user = {
            walletAddress: generateWalletAddress(),
            name,
            role,
            organization: role !== 'STUDENT' ? extraId : undefined,
            studentId: role === 'STUDENT' ? extraId : undefined,
            joinedDate: Date.now()
          };
          users.push(user);
          await setStorage(KEYS.USERS, users);
        }
        
        resolve(user);
      }, 600);
    });
  },

  // --- ADMIN FUNCTIONS ---

  issueCertificate: async (certData: Omit<StudentCertificate, 'certificateId' | 'issueDate'>): Promise<StudentCertificate> => {
    const certs = await getStorage<StudentCertificate>(KEYS.CERTIFICATES);
    
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        // Check for duplicate hash
        if (certs.find(c => c.certificateHash === certData.certificateHash)) {
          reject(new Error("Certificate with this hash already exists on-chain."));
          return;
        }

        const newCert: StudentCertificate = {
          ...certData,
          certificateId: Math.random().toString(36).substring(2, 10).toUpperCase(),
          issueDate: Date.now(),
        };

        certs.unshift(newCert); // Add to beginning
        await setStorage(KEYS.CERTIFICATES, certs);
        resolve(newCert);
      }, DELAY_MS);
    });
  },

  getIssuedCertificates: async (issuerAddress: string): Promise<StudentCertificate[]> => {
    const certs = await getStorage<StudentCertificate>(KEYS.CERTIFICATES);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(certs.filter(c => c.issuerId === issuerAddress));
      }, 400);
    });
  },

  // --- VERIFIER FUNCTIONS ---

  verifyCertificate: async (hash: string, verifierId: string): Promise<StudentCertificate | null> => {
    const certs = await getStorage<StudentCertificate>(KEYS.CERTIFICATES);
    const logs = await getStorage<VerificationLog>(KEYS.VERIFICATION_LOGS);
    
    return new Promise((resolve) => {
      setTimeout(async () => {
        const cert = certs.find(c => c.certificateHash === hash);
        
        // Log the verification attempt
        const newLog: VerificationLog = {
          id: Date.now().toString(),
          verifierId,
          certificateHash: hash,
          timestamp: Date.now(),
          isValid: !!cert
        };
        logs.unshift(newLog);
        await setStorage(KEYS.VERIFICATION_LOGS, logs);

        resolve(cert || null);
      }, DELAY_MS);
    });
  },

  getVerificationLogs: async (verifierId: string): Promise<VerificationLog[]> => {
    const logs = await getStorage<VerificationLog>(KEYS.VERIFICATION_LOGS);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(logs.filter(l => l.verifierId === verifierId));
      }, 400);
    });
  },

  // --- STUDENT FUNCTIONS ---

  getStudentCertificates: async (studentId: string): Promise<StudentCertificate[]> => {
    const certs = await getStorage<StudentCertificate>(KEYS.CERTIFICATES);
    return new Promise((resolve) => {
      setTimeout(() => {
        // Filter by the student ID (e.g., ST-123)
        resolve(certs.filter(c => c.studentId === studentId));
      }, 400);
    });
  },

  uploadStudentDocument: async (doc: Omit<StudentUpload, 'id' | 'timestamp'>): Promise<StudentUpload> => {
    const uploads = await getStorage<StudentUpload>(KEYS.STUDENT_UPLOADS);
    
    return new Promise((resolve) => {
      setTimeout(async () => {
        const newUpload: StudentUpload = {
          ...doc,
          id: Math.random().toString(36).substring(7),
          timestamp: Date.now()
        };
        uploads.unshift(newUpload);
        await setStorage(KEYS.STUDENT_UPLOADS, uploads);
        resolve(newUpload);
      }, DELAY_MS);
    });
  },

  getStudentUploads: async (studentId: string): Promise<StudentUpload[]> => {
    const uploads = await getStorage<StudentUpload>(KEYS.STUDENT_UPLOADS);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(uploads.filter(u => u.studentId === studentId));
      }, 400);
    });
  }
};
