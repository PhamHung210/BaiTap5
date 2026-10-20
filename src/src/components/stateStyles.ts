import { StyleSheet } from 'react-native';

import { spacing } from '../theme';

/** Style dùng chung cho LoadingView / ErrorView / EmptyView */
export const stateStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    minHeight: 320,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    marginTop: spacing.sm,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.xl,
    minWidth: 160,
  },
});
