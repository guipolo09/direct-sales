import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppStoreProvider } from './src/store/AppStore';
import { CrmScreen } from './src/screens/CrmScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { EstoqueScreen } from './src/screens/EstoqueScreen';
import { FinanceiroScreen } from './src/screens/FinanceiroScreen';
import { VendasScreen } from './src/screens/VendasScreen';
import { PedidosScreen } from './src/screens/PedidosScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  Dashboard: 'view-dashboard',
  Estoque: 'package-variant-closed',
  CRM: 'account-group',
  Vendas: 'cart',
  Pedidos: 'clipboard-list',
  Financeiro: 'cash-multiple',
};

export default function App() {
  return (
    <AppStoreProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: '#be123c',
            tabBarInactiveTintColor: '#6b7280',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name={TAB_ICONS[route.name] as any}
                size={size}
                color={color}
              />
            ),
          })}
        >
          <Tab.Screen name="Dashboard" component={DashboardScreen} />
          <Tab.Screen name="Estoque" component={EstoqueScreen} />
          <Tab.Screen name="CRM" component={CrmScreen} />
          <Tab.Screen name="Vendas" component={VendasScreen} />
          <Tab.Screen name="Pedidos" component={PedidosScreen} />
          <Tab.Screen name="Financeiro" component={FinanceiroScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </AppStoreProvider>
  );
}
