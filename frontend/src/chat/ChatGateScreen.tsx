import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthContext } from '../auth/AuthContext';
import { resolveChatRoute } from './chatGateUtils';

interface Props {
    navigation: any;
}

export default function ChatGateScreen({ navigation }: Props) {
    const { refreshGad7Status } = useAuthContext();

    // Fetch fresh status, then route off the RETURNED value — never off context
    // state, which may be stale (e.g. GAD-7 submitted but context not refreshed
    // after a detour through the breathing tab). refreshGad7Status never throws;
    // it returns null on error, and resolveChatRoute(null) fails open to 'Chat'.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const status = await refreshGad7Status();
            if (cancelled) return;
            navigation.replace(resolveChatRoute(status));
        })();
        return () => { cancelled = true; };
    }, []);

    return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#1A59A1" />
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },
});
