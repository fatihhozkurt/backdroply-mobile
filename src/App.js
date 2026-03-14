import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Google from "expo-auth-session/providers/google";
import * as SecureStore from "expo-secure-store";
import * as Sharing from "expo-sharing";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { isHttpsUrl, normalizeBaseUrl, resolveRuntimeBaseUrl, toAbsoluteUrl } from "./runtimeUtils";

WebBrowser.maybeCompleteAuthSession();

const ACCESS_TOKEN_KEY = "backdroply_access_token";
const LANG_KEY = "backdroply_lang";

const I18N = {
  tr: {
    appTitle: "Backdroply Mobile",
    appSubtitle: "Premium arka plan kaldırma akışı",
    signinTitle: "Google ile giriş",
    signinHint: "Kayıt hızlıdır, çoğu kullanıcıda 10 saniyeden kısa sürer.",
    signinCta: "Google ile oturum aç",
    signinDisabled: "Google istemci kimlikleri eksik.",
    signedIn: "Oturum açık",
    signOut: "Çıkış yap",
    deleteAccount: "Hesabı sil",
    lang: "Dil",
    status: "Durum",
    processTitle: "Stüdyo",
    mediaType: "Medya türü",
    image: "Görsel",
    video: "Video",
    pickFile: "Dosya seç",
    fileSelected: "Seçilen dosya",
    quality: "Kalite",
    balanced: "Auto Dengeli",
    ultra: "Auto Ultra",
    background: "Arka plan",
    transparent: "Şeffaf",
    solid: "Tek renk",
    processCta: "İşlemi başlat",
    running: "İşleniyor...",
    resultReady: "İşlem tamamlandı.",
    download: "Çıktıyı indir/paylaş",
    plansTitle: "Planlar",
    plansHint: "Token bittiğinde plan alarak devam edebilirsin.",
    monthly: "Aylık",
    yearly: "Yıllık",
    buy: "Satın al",
    token: "Token",
    history: "Geçmiş",
    myMedia: "My Media",
    empty: "Kayıt yok.",
    legalTitle: "Yasal metinler",
    cookie: "Çerez Politikası",
    privacy: "Gizlilik Politikası",
    terms: "Kullanım Koşulları",
    tokenCost: "İşlem maliyeti",
    watermarkOn: "Filigran uygulanır (ücretsiz katman).",
    watermarkOff: "Filigransız çıktı (ücretli plan).",
    openLegal: "Aç",
    loadError: "Veri yükleme başarısız.",
    downloadFailed: "İndirme başarısız.",
    loginFailed: "Giriş başarısız.",
    logoutDone: "Çıkış yapıldı.",
    accountDeleted: "Hesap silindi.",
    fileRequired: "Önce dosya seç.",
    authRequired: "Önce giriş yap.",
    pickerCanceled: "Dosya seçimi iptal edildi.",
    processingFailed: "İşlem başarısız.",
    purchaseStarted: "Ödeme akışı açıldı.",
    purchaseFailed: "Satın alma başlatılamadı.",
    catalogMissing: "Plan kataloğu alınamadı.",
    starter: "Ücretsiz başlangıç",
    refresh: "Yenile"
  },
  en: {
    appTitle: "Backdroply Mobile",
    appSubtitle: "Premium background removal workflow",
    signinTitle: "Sign in with Google",
    signinHint: "Sign-up is quick, usually under 10 seconds.",
    signinCta: "Sign in with Google",
    signinDisabled: "Google client IDs are missing.",
    signedIn: "Signed in",
    signOut: "Sign out",
    deleteAccount: "Delete account",
    lang: "Language",
    status: "Status",
    processTitle: "Studio",
    mediaType: "Media type",
    image: "Image",
    video: "Video",
    pickFile: "Pick file",
    fileSelected: "Selected file",
    quality: "Quality",
    balanced: "Auto Balanced",
    ultra: "Auto Ultra",
    background: "Background",
    transparent: "Transparent",
    solid: "Solid color",
    processCta: "Start processing",
    running: "Processing...",
    resultReady: "Processing completed.",
    download: "Download/share output",
    plansTitle: "Plans",
    plansHint: "When tokens run out, continue with a plan.",
    monthly: "Monthly",
    yearly: "Yearly",
    buy: "Buy",
    token: "Token",
    history: "History",
    myMedia: "My Media",
    empty: "No records.",
    legalTitle: "Legal pages",
    cookie: "Cookie Policy",
    privacy: "Privacy Policy",
    terms: "Terms of Use",
    tokenCost: "Action cost",
    watermarkOn: "Watermark applies on free tier.",
    watermarkOff: "Watermark-free export on paid plans.",
    openLegal: "Open",
    loadError: "Failed to load data.",
    downloadFailed: "Download failed.",
    loginFailed: "Sign-in failed.",
    logoutDone: "Signed out.",
    accountDeleted: "Account deleted.",
    fileRequired: "Pick a file first.",
    authRequired: "Sign in first.",
    pickerCanceled: "File selection canceled.",
    processingFailed: "Processing failed.",
    purchaseStarted: "Checkout opened.",
    purchaseFailed: "Failed to start purchase.",
    catalogMissing: "Billing catalog unavailable.",
    starter: "Free starter",
    refresh: "Refresh"
  }
};

function readRuntimeConfig() {
  const extra = Constants.expoConfig?.extra || {};
  const apiBaseUrl = resolveRuntimeBaseUrl(
    extra,
    "apiBaseUrl",
    "apiBaseUrlDev",
    "https://api.backdroply.app/api/v1",
    "http://localhost:8080/api/v1"
  );
  const webBaseUrl = resolveRuntimeBaseUrl(
    extra,
    "webBaseUrl",
    "webBaseUrlDev",
    "https://backdroply.app",
    "http://localhost:5173"
  );
  const transportError = !__DEV__ && (!isHttpsUrl(apiBaseUrl) || !isHttpsUrl(webBaseUrl))
    ? "Release build requires HTTPS endpoints for apiBaseUrl and webBaseUrl."
    : "";

  return {
    apiBaseUrl,
    webBaseUrl,
    transportError,
    googleWebClientId: extra.googleWebClientId || "",
    googleAndroidClientId: extra.googleAndroidClientId || "",
    googleIosClientId: extra.googleIosClientId || "",
    supportEmail: extra.supportEmail || "support@backdroply.app",
    kvkkEmail: extra.kvkkEmail || "kvkk@backdroply.app",
    supportPhone: extra.supportPhone || "",
    supportKep: extra.supportKep || "",
    dataDeletionUrl: extra.dataDeletionUrl || "/legal/privacy.html"
  };
}

async function apiRequest(baseUrl, path, { method = "GET", token = "", body = null, isForm = false } = {}) {
  const headers = { Accept: "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== null && !isForm) {
    headers["Content-Type"] = "application/json";
  }
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === null ? undefined : (isForm ? body : JSON.stringify(body))
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
    throw new Error(parsed?.error || `HTTP ${response.status}`);
  }
  return parsed;
}

function Section({ title, rightAction, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {rightAction}
      </View>
      {children}
    </View>
  );
}

function Chip({ active, text, onPress, disabled = false }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.chip,
        active ? styles.chipActive : styles.chipPassive,
        disabled ? styles.disabled : null
      ]}
    >
      <Text style={active ? styles.chipActiveText : styles.chipText}>{text}</Text>
    </Pressable>
  );
}

function ActionButton({ text, onPress, disabled = false, danger = false }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.actionButton,
        danger ? styles.actionDanger : styles.actionPrimary,
        disabled ? styles.disabled : null
      ]}
    >
      <Text style={danger ? styles.actionDangerText : styles.actionPrimaryText}>{text}</Text>
    </Pressable>
  );
}

function GoogleLoginButton({ config, busy, onIdToken, cta }) {
  const [googleRequest, googleResponse, promptGoogleLogin] = Google.useIdTokenAuthRequest({
    webClientId: config.googleWebClientId || undefined,
    androidClientId: config.googleAndroidClientId || undefined,
    iosClientId: config.googleIosClientId || undefined
  });

  useEffect(() => {
    if (!googleResponse || googleResponse.type !== "success") {
      return;
    }
    const idToken = googleResponse.params?.id_token;
    if (!idToken) {
      return;
    }
    void onIdToken(idToken);
  }, [googleResponse, onIdToken]);

  return (
    <ActionButton
      text={cta}
      disabled={!googleRequest || busy}
      onPress={() => promptGoogleLogin()}
    />
  );
}

export default function App() {
  const config = useMemo(readRuntimeConfig, []);
  const [lang, setLang] = useState("tr");
  const t = useMemo(() => I18N[lang] || I18N.tr, [lang]);
  const runtimeSecure = !config.transportError;
  const oauthConfigured = useMemo(
    () => runtimeSecure && Boolean(config.googleWebClientId || config.googleAndroidClientId || config.googleIosClientId),
    [runtimeSecure, config.googleWebClientId, config.googleAndroidClientId, config.googleIosClientId]
  );

  const [booting, setBooting] = useState(true);
  const [busy, setBusy] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("Ready.");
  const [mediaType, setMediaType] = useState("video");
  const [quality, setQuality] = useState("ultra");
  const [bgMode, setBgMode] = useState("transparent");
  const [solidColor, setSolidColor] = useState("#0f172a");
  const [selectedFile, setSelectedFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [activeJobId, setActiveJobId] = useState(null);
  const [catalog, setCatalog] = useState({
    defaultUserTokens: 5,
    tokenCostBalanced: 1,
    tokenCostUltra: 2,
    plans: []
  });
  const [history, setHistory] = useState([]);
  const [myMedia, setMyMedia] = useState([]);

  const tokenCost = quality === "ultra" ? catalog.tokenCostUltra : catalog.tokenCostBalanced;
  const monthlyPlans = catalog.plans.filter((plan) => Number(plan.durationDays || 0) < 365);
  const yearlyPlans = catalog.plans.filter((plan) => Number(plan.durationDays || 0) >= 365);
  const supportEmail = config.supportEmail;
  const kvkkEmail = config.kvkkEmail;
  const supportPhone = config.supportPhone;
  const supportKep = config.supportKep;
  const dataDeletionUrl = toAbsoluteUrl(config.webBaseUrl, config.dataDeletionUrl);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [storedToken, storedLang] = await Promise.all([
          SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
          SecureStore.getItemAsync(LANG_KEY)
        ]);
        if (!alive) {
          return;
        }
        if (storedLang === "tr" || storedLang === "en") {
          setLang(storedLang);
        }
        if (storedToken) {
          setAccessToken(storedToken);
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
    SecureStore.setItemAsync(LANG_KEY, lang).catch(() => {});
  }, [lang]);

  useEffect(() => {
    if (!config.transportError) {
      return undefined;
    }
    setStatus(config.transportError);
    return undefined;
  }, [config.transportError]);

  useEffect(() => {
    let alive = true;
    if (config.transportError) {
      setStatus(config.transportError);
      return () => {
        alive = false;
      };
    }
    apiRequest(config.apiBaseUrl, "/billing/catalog")
      .then((payload) => {
        if (!alive || !payload) {
          return;
        }
        setCatalog({
          defaultUserTokens: Number(payload.defaultUserTokens || 5),
          tokenCostBalanced: Number(payload.tokenCostBalanced || 1),
          tokenCostUltra: Number(payload.tokenCostUltra || 2),
          plans: Array.isArray(payload.plans) ? payload.plans : []
        });
      })
      .catch(() => setStatus(t.catalogMissing));
    return () => {
      alive = false;
    };
  }, [config.apiBaseUrl, config.transportError, t.catalogMissing]);

  useEffect(() => {
    if (!accessToken) {
      setUser(null);
      setHistory([]);
      setMyMedia([]);
      return;
    }
    void refreshSession(accessToken, false);
  }, [accessToken]);

  async function refreshSession(token, showStatus = true) {
    if (config.transportError) {
      setStatus(config.transportError);
      return;
    }
    setBusy(true);
    try {
      const [me, hist, media] = await Promise.all([
        apiRequest(config.apiBaseUrl, "/users/me", { token }),
        apiRequest(config.apiBaseUrl, "/users/history", { token }),
        apiRequest(config.apiBaseUrl, "/media/my-media", { token })
      ]);
      setUser(me);
      setHistory(Array.isArray(hist) ? hist : []);
      setMyMedia(Array.isArray(media) ? media : []);
      if (showStatus) {
        setStatus("OK");
      }
    } catch (err) {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      setAccessToken("");
      setUser(null);
      setHistory([]);
      setMyMedia([]);
      setStatus(`${t.loadError}: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function loginWithGoogle(idToken) {
    if (config.transportError) {
      setStatus(config.transportError);
      return;
    }
    setBusy(true);
    try {
      const payload = await apiRequest(config.apiBaseUrl, "/auth/google/mobile", {
        method: "POST",
        body: { idToken, language: lang }
      });
      const token = payload?.accessToken || "";
      if (!token) {
        throw new Error("Access token missing.");
      }
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
      setAccessToken(token);
      setUser(payload.user || null);
      setStatus(payload?.legalNote || t.signedIn);
    } catch (err) {
      setStatus(`${t.loginFailed}: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    try {
      if (accessToken) {
        await apiRequest(config.apiBaseUrl, "/auth/logout", {
          method: "POST",
          token: accessToken
        });
      }
    } catch {
      // Local secure-store cleanup still proceeds even if network is unavailable.
    } finally {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      setAccessToken("");
      setUser(null);
      setStatus(t.logoutDone);
    }
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
      setStatus(t.accountDeleted);
    } catch (err) {
      setStatus(`${t.loadError}: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function pickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: mediaType === "image" ? "image/*" : "video/*",
        copyToCacheDirectory: true,
        multiple: false
      });
      if (result.canceled) {
        setStatus(t.pickerCanceled);
        return;
      }
      const asset = result.assets?.[0];
      if (!asset) {
        setStatus(t.fileRequired);
        return;
      }
      setSelectedFile(asset);
      setLastResult(null);
      setStatus(`${t.fileSelected}: ${asset.name || "media"}`);
    } catch (err) {
      setStatus(`${t.loadError}: ${err.message}`);
    }
  }

  async function runProcess() {
    if (config.transportError) {
      setStatus(config.transportError);
      return;
    }
    if (!accessToken) {
      setStatus(t.authRequired);
      return;
    }
    if (!selectedFile) {
      setStatus(t.fileRequired);
      return;
    }
    let keepProcessing = false;
    setProcessing(true);
    setStatus(t.running);
    try {
      const form = new FormData();
      form.append("file", {
        uri: selectedFile.uri,
        name: selectedFile.name || `upload-${Date.now()}`,
        type:
          selectedFile.mimeType ||
          (mediaType === "image" ? "image/jpeg" : "video/mp4")
      });
      form.append("quality", quality);
      form.append("bgColor", bgMode === "transparent" ? "transparent" : solidColor);
      const endpoint = mediaType === "image" ? "/media/image" : "/media/video";
      const payload = await apiRequest(config.apiBaseUrl, endpoint, {
        method: "POST",
        token: accessToken,
        body: form,
        isForm: true
      });
      setUser((prev) => (prev ? { ...prev, tokens: Number(payload.tokenBalance || prev.tokens || 0) } : prev));
      const state = String(payload?.status || "").toLowerCase();
      if (state === "success") {
        await applySuccessPayload(payload);
      } else if (state === "failed") {
        setStatus(payload?.errorMessage || t.processingFailed);
      } else {
        keepProcessing = true;
        setActiveJobId(payload?.jobId || null);
        const eta = Number(payload?.etaSeconds || 0);
        const queuePos = Number(payload?.queuePosition || 0);
        const etaText = eta > 0 ? (lang === "tr" ? `Tahmini ~${eta} sn` : `Estimated ~${eta}s`) : "";
        const queueText = lang === "tr" ? `Kuyrukta (#${queuePos + 1})` : `Queued (#${queuePos + 1})`;
        setStatus(`${queueText}${etaText ? ` | ${etaText}` : ""}`);
      }
    } catch (err) {
      setStatus(`${t.processingFailed}: ${err.message}`);
      setActiveJobId(null);
    } finally {
      if (!keepProcessing) {
        setProcessing(false);
      }
    }
  }

  useEffect(() => {
    if (!activeJobId || !accessToken) {
      return undefined;
    }
    let cancelled = false;

    async function pollJobStatus() {
      try {
        const payload = await apiRequest(config.apiBaseUrl, `/media/jobs/${activeJobId}/status`, {
          token: accessToken
        });
        if (cancelled) {
          return;
        }
        setUser((prev) => (prev ? { ...prev, tokens: Number(payload?.tokenBalance || prev.tokens || 0) } : prev));
        const state = String(payload?.status || "").toLowerCase();
        if (state === "success") {
          await applySuccessPayload(payload);
          setActiveJobId(null);
          setProcessing(false);
          return;
        }
        if (state === "failed") {
          setStatus(payload?.errorMessage || t.processingFailed);
          setActiveJobId(null);
          setProcessing(false);
          return;
        }
        const eta = Number(payload?.etaSeconds || 0);
        const queuePos = Number(payload?.queuePosition || 0);
        if (state === "processing") {
          const etaText = eta > 0 ? (lang === "tr" ? `Tahmini ~${eta} sn` : `Estimated ~${eta}s`) : "";
          setStatus(`${lang === "tr" ? "İşleniyor" : "Processing"}${etaText ? ` | ${etaText}` : ""}`);
          return;
        }
        const etaText = eta > 0 ? (lang === "tr" ? `Tahmini ~${eta} sn` : `Estimated ~${eta}s`) : "";
        const queueText = lang === "tr" ? `Kuyrukta (#${queuePos + 1})` : `Queued (#${queuePos + 1})`;
        setStatus(`${queueText}${etaText ? ` | ${etaText}` : ""}`);
      } catch (err) {
        if (cancelled) {
          return;
        }
        setStatus(`${t.processingFailed}: ${err.message}`);
        setActiveJobId(null);
        setProcessing(false);
      }
    }

    void pollJobStatus();
    const timer = setInterval(() => {
      void pollJobStatus();
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [activeJobId, accessToken, config.apiBaseUrl, lang, t.processingFailed]);

  async function applySuccessPayload(payload) {
    setLastResult(payload);
    setStatus(
      `${t.resultReady} ${t.tokenCost}: ${payload.tokenCostUsed}. ${
        payload.watermarkApplied ? t.watermarkOn : t.watermarkOff
      }`
    );
    await refreshSession(accessToken, false);
  }

  async function downloadLastResult() {
    if (!lastResult?.downloadUrl || !accessToken) {
      return;
    }
    try {
      const absoluteUrl = toAbsoluteUrl(config.apiBaseUrl, lastResult.downloadUrl);
      const safeName = (lastResult.outputName || `backdroply-${Date.now()}`).replace(/[^\w.\-]+/g, "_");
      const targetFile = `${FileSystem.cacheDirectory}${safeName}`;
      await FileSystem.downloadAsync(absoluteUrl, targetFile, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(targetFile);
      }
    } catch (err) {
      setStatus(`${t.downloadFailed}: ${err.message}`);
    }
  }

  async function buyPlan(planCode) {
    if (config.transportError) {
      setStatus(config.transportError);
      return;
    }
    if (!accessToken) {
      setStatus(t.authRequired);
      return;
    }
    setBusy(true);
    try {
      const payload = await apiRequest(config.apiBaseUrl, "/billing/purchase-intent", {
        method: "POST",
        token: accessToken,
        body: { packCode: planCode }
      });
      const checkoutUrl = toAbsoluteUrl(config.webBaseUrl, payload.checkoutUrl);
      await WebBrowser.openBrowserAsync(checkoutUrl);
      setStatus(t.purchaseStarted);
      await refreshSession(accessToken, false);
    } catch (err) {
      setStatus(`${t.purchaseFailed}: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function openLegal(path) {
    const url = `${config.webBaseUrl}${path}?lang=${lang}`;
    await WebBrowser.openBrowserAsync(url);
  }

  async function openSupportEmail() {
    await Linking.openURL(`mailto:${supportEmail}`);
  }

  async function openKvkkEmail() {
    await Linking.openURL(`mailto:${kvkkEmail}`);
  }

  async function openDataDeletion() {
    const url = `${dataDeletionUrl}${dataDeletionUrl.includes("?") ? "&" : "?"}lang=${lang}`;
    await WebBrowser.openBrowserAsync(url);
  }

  if (booting) {
    return (
      <SafeAreaView style={styles.root}>
        <ActivityIndicator color="#38bdf8" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>{t.appTitle}</Text>
          <Text style={styles.heroSubtitle}>{t.appSubtitle}</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.metaLabel}>
              {t.lang}: {lang.toUpperCase()}
            </Text>
            <View style={styles.row}>
              <Chip text="TR" active={lang === "tr"} onPress={() => setLang("tr")} />
              <Chip text="EN" active={lang === "en"} onPress={() => setLang("en")} />
            </View>
          </View>
          <Text style={styles.statusLine}>
            {t.status}: {status}
          </Text>
        </View>

        <Section
          title={t.signinTitle}
          rightAction={
            user ? (
              <Text style={styles.tokenBadge}>
                {t.token}: {user?.tokens ?? 0}
              </Text>
            ) : null
          }
        >
          <Text style={styles.helpText}>{t.signinHint}</Text>
          {!user ? (
            oauthConfigured ? (
              <GoogleLoginButton config={config} busy={busy} onIdToken={loginWithGoogle} cta={t.signinCta} />
            ) : (
              <Text style={styles.warningText}>{t.signinDisabled}</Text>
            )
          ) : (
            <View>
              <Text style={styles.okText}>{t.signedIn}: {user?.email}</Text>
              <View style={styles.row}>
                <ActionButton text={t.signOut} onPress={signOut} disabled={busy} />
                <ActionButton text={t.deleteAccount} onPress={deleteAccount} disabled={busy} danger />
              </View>
            </View>
          )}
        </Section>

        {user ? (
          <Section
            title={t.processTitle}
            rightAction={<ActionButton text={t.refresh} onPress={() => refreshSession(accessToken)} disabled={busy || processing} />}
          >
            <Text style={styles.label}>{t.mediaType}</Text>
            <View style={styles.row}>
              <Chip text={t.video} active={mediaType === "video"} onPress={() => setMediaType("video")} disabled={processing} />
              <Chip text={t.image} active={mediaType === "image"} onPress={() => setMediaType("image")} disabled={processing} />
            </View>

            <View style={styles.spacer} />
            <ActionButton text={t.pickFile} onPress={pickFile} disabled={processing} />
            {selectedFile ? (
              <Text style={styles.metaValue}>
                {t.fileSelected}: {selectedFile.name || "media"} ({Math.round((selectedFile.size || 0) / 1024)} KB)
              </Text>
            ) : null}

            <Text style={[styles.label, styles.mt12]}>{t.quality}</Text>
            <View style={styles.row}>
              <Chip
                text={`${t.balanced} (${catalog.tokenCostBalanced})`}
                active={quality === "balanced"}
                onPress={() => setQuality("balanced")}
                disabled={processing}
              />
              <Chip
                text={`${t.ultra} (${catalog.tokenCostUltra})`}
                active={quality === "ultra"}
                onPress={() => setQuality("ultra")}
                disabled={processing}
              />
            </View>

            <Text style={[styles.label, styles.mt12]}>{t.background}</Text>
            <View style={styles.row}>
              <Chip
                text={t.transparent}
                active={bgMode === "transparent"}
                onPress={() => setBgMode("transparent")}
                disabled={processing}
              />
              <Chip
                text={t.solid}
                active={bgMode === "solid"}
                onPress={() => setBgMode("solid")}
                disabled={processing}
              />
            </View>
            {bgMode === "solid" ? (
              <View style={[styles.row, styles.mt8]}>
                <Chip text="#0f172a" active={solidColor === "#0f172a"} onPress={() => setSolidColor("#0f172a")} />
                <Chip text="#111827" active={solidColor === "#111827"} onPress={() => setSolidColor("#111827")} />
                <Chip text="#ffffff" active={solidColor === "#ffffff"} onPress={() => setSolidColor("#ffffff")} />
              </View>
            ) : null}

            <View style={styles.mt12}>
              <ActionButton
                text={`${processing ? t.running : t.processCta} • ${tokenCost}`}
                onPress={runProcess}
                disabled={processing}
              />
            </View>
            <Text style={styles.helpText}>
              {t.tokenCost}: {tokenCost}
            </Text>

            {lastResult ? (
              <View style={styles.mt12}>
                <Text style={styles.okText}>
                  {t.resultReady} {lastResult.outputName}
                </Text>
                <ActionButton text={t.download} onPress={downloadLastResult} />
              </View>
            ) : null}
          </Section>
        ) : null}

        {user ? (
          <Section title={t.plansTitle}>
            <Text style={styles.helpText}>{t.plansHint}</Text>
            <Text style={styles.helpText}>
              {lang === "tr" ? "Destek/İade/İptal için iletişim: " : "Support/refund/cancellation: "}
              {supportEmail}
            </Text>
            <Text style={styles.metaValue}>
              {t.starter}: {catalog.defaultUserTokens} {t.token}
            </Text>
            {catalog.plans.length === 0 ? (
              <Text style={styles.warningText}>{t.catalogMissing}</Text>
            ) : (
              <View style={styles.planList}>
                {monthlyPlans.map((plan) => (
                  <Pressable
                    key={plan.code}
                    style={[styles.planCard, plan.popular ? styles.planPopular : null]}
                    onPress={() => buyPlan(plan.code)}
                    disabled={busy}
                  >
                    <Text style={styles.planTitle}>{lang === "tr" ? plan.labelTr : plan.labelEn}</Text>
                    <Text style={styles.planMeta}>
                      {t.monthly} • {plan.tokens} {t.token}
                    </Text>
                    <Text style={styles.planMeta}>{Number(plan.amountTry).toFixed(2)} TRY</Text>
                  </Pressable>
                ))}
                {yearlyPlans.map((plan) => (
                  <Pressable key={plan.code} style={[styles.planCard, styles.planYearly]} onPress={() => buyPlan(plan.code)} disabled={busy}>
                    <Text style={styles.planTitle}>{lang === "tr" ? plan.labelTr : plan.labelEn}</Text>
                    <Text style={styles.planMeta}>
                      {t.yearly} • {plan.tokens} {t.token}
                    </Text>
                    <Text style={styles.planMeta}>{Number(plan.amountTry).toFixed(2)} TRY</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </Section>
        ) : null}

        {user ? (
          <Section title={t.history}>
            {history.length === 0 ? (
              <Text style={styles.helpText}>{t.empty}</Text>
            ) : (
              history.slice(0, 8).map((item) => (
                <View key={item.id} style={styles.listRow}>
                  <Text style={styles.listTitle}>
                    {item.mediaType} • {item.quality}
                  </Text>
                  <Text style={styles.listMeta}>{item.inputName}</Text>
                </View>
              ))
            )}
          </Section>
        ) : null}

        {user ? (
          <Section title={t.myMedia}>
            {myMedia.length === 0 ? (
              <Text style={styles.helpText}>{t.empty}</Text>
            ) : (
              myMedia.slice(0, 10).map((item) => (
                <View key={item.jobId} style={styles.listRow}>
                  <Text style={styles.listTitle}>{item.outputName}</Text>
                  <Text style={styles.listMeta}>{item.createdAt}</Text>
                </View>
              ))
            )}
          </Section>
        ) : null}

        <Section title={t.legalTitle}>
          <Text style={styles.helpText}>
            {lang === "tr" ? "Destek e-postası: " : "Support email: "}
            {supportEmail}
          </Text>
          <Text style={styles.helpText}>
            {lang === "tr" ? "KVKK başvuru e-postası: " : "Data rights email: "}
            {kvkkEmail}
          </Text>
          {supportPhone ? (
            <Text style={styles.helpText}>
              {lang === "tr" ? "Telefon: " : "Phone: "}
              {supportPhone}
            </Text>
          ) : null}
          {supportKep ? (
            <Text style={styles.helpText}>KEP: {supportKep}</Text>
          ) : null}
          <View style={styles.row}>
            <ActionButton text={lang === "tr" ? "Destek e-postası aç" : "Open support email"} onPress={openSupportEmail} />
          </View>
          <View style={styles.row}>
            <ActionButton text={lang === "tr" ? "KVKK e-postası aç" : "Open data rights email"} onPress={openKvkkEmail} />
          </View>
          <View style={styles.row}>
            <ActionButton text={lang === "tr" ? "Veri silme sayfasını aç" : "Open data deletion page"} onPress={openDataDeletion} />
          </View>
          <View style={styles.row}>
            <ActionButton text={`${t.cookie} • ${t.openLegal}`} onPress={() => openLegal("/legal/cookies.html")} />
          </View>
          <View style={styles.row}>
            <ActionButton text={`${t.privacy} • ${t.openLegal}`} onPress={() => openLegal("/legal/privacy.html")} />
          </View>
          <View style={styles.row}>
            <ActionButton text={`${t.terms} • ${t.openLegal}`} onPress={() => openLegal("/legal/terms.html")} />
          </View>
        </Section>
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
    padding: 14,
    paddingBottom: 28
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1e293b",
    backgroundColor: "#081228",
    padding: 16,
    marginBottom: 12
  },
  heroTitle: {
    color: "#e2e8f0",
    fontSize: 24,
    fontWeight: "700"
  },
  heroSubtitle: {
    marginTop: 4,
    color: "#93c5fd"
  },
  statusLine: {
    marginTop: 10,
    color: "#cbd5e1",
    fontSize: 12
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1e293b",
    backgroundColor: "#0b1220",
    padding: 14,
    marginBottom: 12
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  sectionTitle: {
    color: "#e2e8f0",
    fontSize: 17,
    fontWeight: "700"
  },
  tokenBadge: {
    color: "#fef3c7",
    fontSize: 12,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.35)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: "hidden"
  },
  label: {
    color: "#cbd5e1",
    fontSize: 13,
    marginBottom: 6
  },
  helpText: {
    color: "#94a3b8",
    fontSize: 12,
    marginBottom: 8
  },
  warningText: {
    color: "#fcd34d",
    fontSize: 12
  },
  okText: {
    color: "#86efac",
    fontSize: 12,
    marginBottom: 8
  },
  metaLabel: {
    color: "#94a3b8",
    fontSize: 12
  },
  metaValue: {
    color: "#cbd5e1",
    fontSize: 12,
    marginTop: 8
  },
  rowBetween: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center"
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginRight: 8,
    marginTop: 4
  },
  chipActive: {
    borderColor: "rgba(56,189,248,0.6)",
    backgroundColor: "rgba(56,189,248,0.18)"
  },
  chipPassive: {
    borderColor: "#334155",
    backgroundColor: "#0f172a"
  },
  chipText: {
    color: "#cbd5e1",
    fontSize: 12
  },
  chipActiveText: {
    color: "#e0f2fe",
    fontSize: 12,
    fontWeight: "600"
  },
  actionButton: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  actionPrimary: {
    backgroundColor: "#38bdf8"
  },
  actionPrimaryText: {
    color: "#020617",
    fontWeight: "700",
    fontSize: 13
  },
  actionDanger: {
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.65)",
    backgroundColor: "rgba(244,63,94,0.12)"
  },
  actionDangerText: {
    color: "#fecdd3",
    fontWeight: "700",
    fontSize: 13
  },
  disabled: {
    opacity: 0.5
  },
  spacer: {
    height: 6
  },
  mt8: {
    marginTop: 8
  },
  mt12: {
    marginTop: 12
  },
  planList: {
    marginTop: 8
  },
  planCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#111827",
    padding: 10,
    marginBottom: 8
  },
  planPopular: {
    borderColor: "rgba(56,189,248,0.6)",
    backgroundColor: "rgba(56,189,248,0.12)"
  },
  planYearly: {
    borderColor: "rgba(16,185,129,0.55)",
    backgroundColor: "rgba(16,185,129,0.1)"
  },
  planTitle: {
    color: "#f8fafc",
    fontWeight: "700",
    fontSize: 14
  },
  planMeta: {
    color: "#cbd5e1",
    fontSize: 12,
    marginTop: 3
  },
  listRow: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
    backgroundColor: "#0f172a",
    padding: 10,
    marginBottom: 8
  },
  listTitle: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "700"
  },
  listMeta: {
    color: "#94a3b8",
    marginTop: 3,
    fontSize: 11
  }
});
