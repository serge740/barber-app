import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import SafestView from "../ThemedView";
import { StatusBar } from "react-native";


interface Props {
  children: React.ReactNode;
}

export default function GuestOnly({ children }: Props) {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/(dashboard)");
    }
  }, [isAuthenticated, loading]);

  if (loading) {
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