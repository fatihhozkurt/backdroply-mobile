import * as Google from "expo-auth-session/providers/google";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

WebBrowser.maybeCompleteAuthSession();

const ACCESS_TOKEN_KEY = "backdroply_access_token";

function readRuntimeConfig() {
  const extra = Constants.expoConfig?.extra || {};
  return {
    apiBaseUrl: (extra.apiBaseUrl || "http://localhost:8080/api/v1").replace(/\/+$/, ""),
    googleWebClientId: extra.googleWebClientId || "",
    googleAndroidClientId: extra.googleAndroidClientId || "",
    googleIosClientId: extra.googleIosClientId || ""
  };
}

async function apiRequest(baseUrl, path, { method = "GET", token = "", body = null } = {}) {
  const headers = { Accept: "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== null) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === null ? undefined : JSON.stringify(body)
  });

  const text = await response.text();
  let parsed = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    const errorText = parsed?.error || `HTTP ${response.status}`;
    throw new Error(errorText);
  }
  return parsed;
}

export default function App() {
  const config = useMemo(readRuntimeConfig, []);
  const [accessToken, setAccessToken] = useState("");
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("Ready.");
  const [booting, setBooting] = useState(true);
  const [busy, setBusy] = useState(false);

  const [googleRequest, googleResponse, promptGoogleLogin] = Google.useIdTokenAuthRequest({
    webClientId: config.googleWebClientId || undefined,
    androidClientId: config.googleAndroidClientId || undefined,
    iosClientId: config.googleIosClientId || undefined
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
        if (alive && token) {
          setAccessToken(token);
        }
      } finally {
        if (alive) {
          setBooting(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!googleResponse || googleResponse.type !== "success") {
      return;
    }
    const idToken = googleResponse.params?.id_token;
    if (!idToken) {
      setStatus("Google login failed: id_token is missing.");
      return;
    }
    void loginWithGoogle(idToken);
  }, [googleResponse]);

  useEffect(() => {
    if (!accessToken) {
      setUser(null);
      return;
    }
    let alive = true;
    setBusy(true);
    apiRequest(config.apiBaseUrl, "/users/me", { token: accessToken })
      .then((me) => {
        if (alive) {
          setUser(me);
          setStatus("Signed in.");
        }
      })
      .catch(async (err) => {
        if (!alive) {
          return;
        }
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        setAccessToken("");
        setUser(null);
        setStatus(`Session expired: ${err.message}`);
      })
      .finally(() => {
        if (alive) {
          setBusy(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [accessToken, config.apiBaseUrl]);

  async function loginWithGoogle(idToken) {
    setBusy(true);
    setStatus("Signing in...");
    try {
      const payload = await apiRequest(config.apiBaseUrl, "/auth/google/mobile", {
        method: "POST",
        body: { idToken, language: "tr" }
      });
      const token = payload?.accessToken || "";
      if (!token) {
        throw new Error("Access token was not returned.");
      }
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
      setAccessToken(token);
      setUser(payload.user || null);
      setStatus("Google sign-in completed.");
    } catch (err) {
      setStatus(`Sign-in failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    setAccessToken("");
    setUser(null);
    setStatus("Signed out.");
  }

  async function deleteAccount() {
    if (!accessToken) {
      return;
    }
    setBusy(true);
    try {
      await apiRequest(config.apiBaseUrl, "/users/me", {
        method: "DELETE",
        token: accessToken
      });
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      setAccessToken("");
      setUser(null);
      setStatus("Account deleted.");
    } catch (err) {
      setStatus(`Account deletion failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  if (booting) {
    return (
      <SafeAreaView style={styles.root}>
        <ActivityIndicator color="#7dd3fc" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Backdroply Mobile</Text>
          <Text style={styles.subtitle}>OAuth + Secure Token + API session</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>User</Text>
            <Text style={styles.metaValue}>{user?.email || "-"}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Tokens</Text>
            <Text style={styles.metaValue}>{user?.tokens ?? 0}</Text>
          </View>

          <Text style={styles.status}>{status}</Text>

          {!user ? (
            <Pressable
              style={[styles.buttonPrimary, (!googleRequest || busy) && styles.buttonDisabled]}
              disabled={!googleRequest || busy}
              onPress={() => promptGoogleLogin()}
            >
              <Text style={styles.buttonPrimaryText}>Sign in with Google</Text>
            </Pressable>
          ) : (
            <View style={styles.actions}>
              <Pressable style={[styles.buttonPrimary, busy && styles.buttonDisabled]} disabled={busy} onPress={signOut}>
                <Text style={styles.buttonPrimaryText}>Sign out</Text>
              </Pressable>
              <Pressable style={[styles.buttonDanger, busy && styles.buttonDisabled]} disabled={busy} onPress={deleteAccount}>
                <Text style={styles.buttonDangerText}>Delete account</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#030712"
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  card: {
    width: "100%",
    maxWidth: 460,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1e293b",
    backgroundColor: "#0b1220",
    padding: 20
  },
  title: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "700"
  },
  subtitle: {
    marginTop: 4,
    color: "#94a3b8"
  },
  metaRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  metaLabel: {
    color: "#94a3b8"
  },
  metaValue: {
    color: "#dbeafe",
    fontWeight: "700"
  },
  status: {
    marginTop: 16,
    color: "#cbd5e1"
  },
  actions: {
    marginTop: 12,
    gap: 10
  },
  buttonPrimary: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: "#38bdf8",
    paddingVertical: 10,
    alignItems: "center"
  },
  buttonPrimaryText: {
    color: "#020617",
    fontWeight: "700"
  },
  buttonDanger: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fb7185",
    backgroundColor: "rgba(244,63,94,0.1)",
    paddingVertical: 10,
    alignItems: "center"
  },
  buttonDangerText: {
    color: "#fecdd3",
    fontWeight: "700"
  },
  buttonDisabled: {
    opacity: 0.45
  }
});
