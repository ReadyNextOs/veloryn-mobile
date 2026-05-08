import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { withTranslation, type WithTranslation } from 'react-i18next';

interface Props extends WithTranslation {
  children: React.ReactNode;
  fallbackTitleKey?: string;
  fallbackDescriptionKey?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryInner extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    if (__DEV__) {
      console.warn('[ErrorBoundary]', error, info.componentStack);
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const { t, fallbackTitleKey, fallbackDescriptionKey } = this.props;
      const title = t(fallbackTitleKey ?? 'errors.boundary.title');
      const description = t(fallbackDescriptionKey ?? 'errors.boundary.description');
      const retry = t('errors.boundary.retry');

      return (
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          {__DEV__ && this.state.error ? (
            <Text style={styles.devError}>{this.state.error.message}</Text>
          ) : null}
          <TouchableOpacity style={styles.button} onPress={this.handleRetry} activeOpacity={0.75}>
            <Text style={styles.buttonText}>{retry}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export const ErrorBoundary = withTranslation('common')(ErrorBoundaryInner);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.87)',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.6)',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  devError: {
    fontSize: 12,
    color: '#d32f2f',
    fontFamily: 'Menlo',
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#7a24a1',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
