import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Home, LogIn, ShoppingBag, UserPlus } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import LoginScreen from "./src/screens/LoginScreen.js";
import SignupScreen from "./src/screens/SignupScreen.js";
import MarketplaceScreen from "./src/screens/MarketplaceScreen.js";
import ProductDetailScreen from "./src/screens/ProductDetailScreen.js";
import { colors } from "./src/theme.js";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.navy,
    card: colors.panel,
    border: colors.border,
    primary: colors.brand,
    text: colors.text,
  },
};

function MarketplaceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.panel }, headerTintColor: colors.text }}>
      <Stack.Screen name="MarketplaceList" component={MarketplaceScreen} options={{ title: "Marketplace" }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: "Product detail" }} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: { backgroundColor: colors.panel, borderTopColor: colors.border },
          tabBarActiveTintColor: colors.brand,
          tabBarInactiveTintColor: colors.muted,
          headerStyle: { backgroundColor: colors.panel },
          headerTintColor: colors.text,
        }}
      >
        <Tab.Screen name="Home" component={MarketplaceStack} options={{ headerShown: false, tabBarIcon: ({ color }) => <Home color={color} size={21} /> }} />
        <Tab.Screen name="Login" component={LoginScreen} options={{ tabBarIcon: ({ color }) => <LogIn color={color} size={21} /> }} />
        <Tab.Screen name="Signup" component={SignupScreen} options={{ tabBarIcon: ({ color }) => <UserPlus color={color} size={21} /> }} />
        <Tab.Screen name="Products" component={MarketplaceStack} options={{ headerShown: false, tabBarIcon: ({ color }) => <ShoppingBag color={color} size={21} /> }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
