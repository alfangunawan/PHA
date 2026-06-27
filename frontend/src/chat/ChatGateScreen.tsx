import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthContext } from '../auth/AuthContext';
import { resolveChatRoute } from './chatGateUtils';

interface Props {
    navigation: any;
}

export default function ChatGateScreen({ navigation }: Props) {
    const { gad7LoadingState, gad7Status } = useAuthContext();

    useEffect(() => {
        if (gad7LoadingState === 'loading') return; // wait
        if (gad7LoadingState === 'error') {
            navigation.replace('Chat'); // fail-open
            return;
        }
        // 'ready' — status is known
        navigation.replace(resolveChatRoute(gad7Status));
    }, [gad7LoadingState]);

    return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#1A59A1" />
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },
});
