
/**
 * Utility for Web Authentication API (Biometrics)
 */
export const requestBiometricAuth = async (username: string = 'NatuAssist Admin'): Promise<boolean> => {
  if (!window.PublicKeyCredential) {
    console.warn('WebAuthn is not supported in this browser.');
    return false;
  }

  try {
    // This is a simplified challenge for demonstration.
    // In a real production app, the challenge should come from the server.
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userID = new Uint8Array(16);
    window.crypto.getRandomValues(userID);

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: "NatuAssist",
        id: window.location.hostname,
      },
      user: {
        id: userID,
        name: username,
        displayName: username,
      },
      pubKeyCredParams: [{ alg: -7, type: "public-key" }], // ES256
      authenticatorSelection: {
        authenticatorAttachment: "platform", // This triggers biometrics (TouchID, FaceID, Windows Hello)
        userVerification: "required",
      },
      timeout: 15000,
      attestation: "none",
    };

    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    });

    return !!credential;
  } catch (error) {
    console.error('Biometric authentication failed:', error);
    // Fallback for environments where WebAuthn might be restricted (like some iframes)
    // In a real app, we'd handle specific error types
    return false;
  }
};
