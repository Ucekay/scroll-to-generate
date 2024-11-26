import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { BlurView } from 'expo-blur';

export default function RootLayout() {
	return (
		<Stack
			screenOptions={{
				headerTransparent: true,
				headerTintColor: 'white',
				headerBackground: () => (
					<BlurView intensity={100} style={StyleSheet.absoluteFill} />
				),
			}}
		/>
	);
}
