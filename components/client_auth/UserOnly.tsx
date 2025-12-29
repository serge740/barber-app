import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, StatusBar } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useClientAuth } from "@/context/ClientAuthContext";
import SafestView from "../ThemedView";

interface Props {
  children: React.ReactNode;
}

export default function UserOnly({ children }: Props) {
  const { isAuthenticated, loading } = useClientAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/(auth)/client_login");
    }
  }, [isAuthenticated, loading]);

  if (loading || !isAuthenticated) {
    return (
     <SafestView safe no_bottom >
     
             <StatusBar barStyle="light-content" backgroundColor="#6F4E37" />
           <View style={styles.container}>
             <ActivityIndicator size="large" color="#6F4E37" />
           </View>
            </SafestView>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5DC",
  },
});