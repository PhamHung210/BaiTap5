import { useEvent } from 'expo';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

import { AppButton } from '../src/components/AppButton';
import { ErrorView } from '../src/components/ErrorView';
import { spacing } from '../src/theme';
import { extractYouTubeId, isYouTubeUrl } from '../src/utils/video';

/** Màn phát trailer: YouTube => react-native-youtube-iframe, còn lại (MP4) => expo-video */
export default function TrailerScreen() {
  const params = useLocalSearchParams<{ url?: string; title?: string }>();
  const url = String(params.url ?? '').trim();
  const title = params.title ? String(params.title) : 'Trailer';
  // Mỗi lần bấm "Thử lại" tăng attempt => component player được tạo mới hoàn toàn
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  const header = (
    <Stack.Screen
      options={{
        title,
        headerStyle: { backgroundColor: '#000' },
        headerTitleStyle: { color: '#fff' },
        headerTintColor: '#fff',
      }}
    />
  );

  if (!url) {
    return (
      <>
        {header}
        <ErrorView title="Không có trailer" message="Khóa học này chưa có URL trailer." icon="videocam-off-outline" />
      </>
    );
  }

  if (isYouTubeUrl(url)) {
    const videoId = extractYouTubeId(url);
    return (
      <View style={styles.screen}>
        {header}
        {videoId ? (
          <YouTubeTrailer key={attempt} videoId={videoId} onRetry={retry} />
        ) : (
          <PlayerMessage message="Không nhận dạng được video YouTube từ URL này." />
        )}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {header}
      <Mp4Trailer key={attempt} url={url} onRetry={retry} />
    </View>
  );
}

/** Phát MP4 bằng expo-video */
function Mp4Trailer({ url, onRetry }: { url: string; onRetry: () => void }) {
  const { width } = useWindowDimensions();

  // useVideoPlayer tự release player khi component unmount (rời màn hình / bấm Thử lại)
  const player = useVideoPlayer(url, (p) => {
    p.play(); // tự phát khi mở màn hình
  });

  // Lắng nghe sự kiện statusChange: 'idle' | 'loading' | 'readyToPlay' | 'error'
  const { status, error } = useEvent(player, 'statusChange', { status: player.status, error: undefined });

  return (
    <View style={[styles.playerBox, { width, height: (width * 9) / 16 }]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        nativeControls
        fullscreenOptions={{ enable: true }}
        contentFit="contain"
      />
      {status === 'loading' ? (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.overlayText}>Đang tải video...</Text>
        </View>
      ) : null}
      {status === 'error' ? (
        <PlayerMessage
          message={`Không phát được video${error?.message ? `: ${error.message}` : ''}`}
          onRetry={onRetry}
          overlay
        />
      ) : null}
    </View>
  );
}

/** Phát video YouTube qua WebView (react-native-youtube-iframe) */
function YouTubeTrailer({ videoId, onRetry }: { videoId: string; onRetry: () => void }) {
  const { width } = useWindowDimensions();
  const height = (width * 9) / 16;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (error) {
    return (
      <View style={[styles.playerBox, { width, height }]}>
        <PlayerMessage message={`Không phát được video YouTube (${error})`} onRetry={onRetry} overlay />
      </View>
    );
  }

  return (
    <View style={[styles.playerBox, { width, height }]}>
      <YoutubePlayer
        height={height}
        width={width}
        videoId={videoId}
        play
        forceAndroidAutoplay
        onReady={() => setReady(true)}
        onError={(e: string) => setError(e)}
      />
      {!ready ? (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.overlayText}>Đang tải video...</Text>
        </View>
      ) : null}
    </View>
  );
}

function PlayerMessage({ message, onRetry, overlay }: { message: string; onRetry?: () => void; overlay?: boolean }) {
  return (
    <View style={overlay ? styles.overlay : styles.messageBox}>
      <Text style={styles.overlayText}>{message}</Text>
      {onRetry ? <AppButton title="Thử lại" icon="refresh" onPress={onRetry} style={styles.retry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  playerBox: { backgroundColor: '#000', justifyContent: 'center' },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: spacing.lg,
  },
  messageBox: { alignItems: 'center', padding: spacing.xl },
  overlayText: { color: '#fff', fontSize: 15, marginTop: spacing.md, textAlign: 'center' },
  retry: { marginTop: spacing.lg, minWidth: 140 },
});
