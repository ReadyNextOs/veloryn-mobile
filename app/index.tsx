import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth';

export default function Index() {
  const isPaired = useAuthStore((s) => s.isPaired);
  return <Redirect href={isPaired ? '/(tabs)/messenger' : '/(auth)/pair'} />;
}
