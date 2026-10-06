import { View, Text, TextInput, Pressable, Keyboard, StyleSheet, useWindowDimensions } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, Sun, Moon } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import { useColorScheme } from 'nativewind';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase/client';

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const router = useRouter();
  const { signIn } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { colorScheme, toggleColorScheme } = useColorScheme();

  const handleSubmit = async () => {
    if (!email || !password) {
      showToast({
        type: 'error',
        title: 'Missing fields',
        description: 'Please enter both email and password',
      });
      return;
    }

    setLoading(true);
    Keyboard.dismiss();

    const { error } = await signIn(email, password);

    if (error) {
      showToast({
        type: 'error',
        title: 'Login failed',
        description: error.message,
      });
      setLoading(false);
      return;
    }
    
    // Verifikasi bahwa user adalah admin
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
        
      if (data?.role !== 'admin') {
        await supabase.auth.signOut();
        showToast({
          type: 'error',
          title: 'Access Denied',
          description: 'You do not have administrator privileges.',
        });
        setLoading(false);
        return;
      }
    }

    showToast({
      type: 'success',
      title: 'Welcome back!',
      description: 'You have successfully logged in.',
    });
    router.replace('/admin/dashboard');
    setLoading(false);
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-dark-bg relative" style={styles.container}>
      {/* Theme Toggle */}
      <Pressable 
        onPress={toggleColorScheme}
        className="absolute top-12 right-6 p-3 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 z-10"
      >
        {colorScheme === 'dark' ? <Sun size={24} className="text-yellow-500" /> : <Moon size={24} className="text-gray-600" />}
      </Pressable>

      <View className="flex-1 justify-center items-center p-4" style={[styles.content, { paddingTop: isWeb ? 60 : 20 }]}>
        <Card variant="outlined" className={cn('w-full', isWeb ? 'max-w-md' : '')}>
          <View className="p-8">
            {/* Logo/Title */}
            <View className="items-center mb-8">
              <View className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center mb-4 shadow-lg mx-auto">
                <Text className="text-3xl font-bold text-white">P</Text>
              </View>
              <Text className={cn('font-bold text-center text-gray-900 dark:text-white', isWeb ? 'text-3xl' : 'text-2xl')}>
                Admin Panel
              </Text>

            </View>

            {/* Form */}
            <View className="space-y-4">
              <Input
                id="email"
                type="email"
                label="Email"
                placeholder="admin@example.com"
                value={email}
                onChangeText={setEmail}
                autoComplete="email"
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                leftIcon={<Mail size={20} className="text-gray-400" />}
              />

              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                autoComplete="password"
                returnKeyType="go"
                onSubmitEditing={handleSubmit}
                secureTextEntry={!showPassword}
                leftIcon={<Lock size={20} className="text-gray-400" />}
                rightElement={
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={20} color="gray" /> : <Eye size={20} color="gray" />}
                  </Pressable>
                }
              />

              <Button
                size="lg"
                fullWidth
                loading={loading}
                rightIcon={<ArrowRight size={20} />}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </View>



            {/* Back to portfolio */}
            <View className="mt-8 flex-row items-center justify-center">
              <Text className="text-gray-500 dark:text-gray-400 text-sm">
                Not an admin?{' '}
              </Text>
              <Link href="/" className="text-primary-600 dark:text-primary-400 font-medium text-sm hover:underline">
                Back to Portfolio
              </Link>
            </View>
          </View>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: '100%',
  },
  content: {
    paddingBottom: 60,
  },
});