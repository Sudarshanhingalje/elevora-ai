import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Search } from "lucide-react-native";
import { apiRequest } from "../api/client.js";
import { colors, radius } from "../theme.js";

export default function MarketplaceScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiRequest("/api/products?tenantSlug=elevora-ai")
      .then(setProducts)
      .catch((error) => setMessage(error.message));
  }, []);

  const filtered = products.filter((product) => `${product.name} ${product.description}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={styles.container}>
      <View style={styles.search}>
        <Search color={colors.muted} size={18} />
        <TextInput placeholder="Search AI products" placeholderTextColor={colors.muted} style={styles.searchInput} value={search} onChangeText={setSearch} />
      </View>
      {message ? <Text style={styles.error}>{message}</Text> : null}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => navigation.navigate("ProductDetail", { product: item })}>
            <Text style={styles.category}>{item.category}</Text>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.price}>₹{Number(item.price).toLocaleString("en-IN")}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.navy, padding: 16 },
  search: { height: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.control, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  searchInput: { flex: 1, color: colors.text },
  list: { paddingTop: 16, gap: 12 },
  card: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel, borderRadius: radius.card, padding: 16, marginBottom: 12 },
  category: { color: colors.brand, fontWeight: "800", fontSize: 12 },
  title: { color: colors.text, fontSize: 20, fontWeight: "800", marginTop: 8 },
  description: { color: colors.muted, marginTop: 8, lineHeight: 20 },
  price: { color: colors.text, fontSize: 22, fontWeight: "900", marginTop: 12 },
  error: { color: "#FCA5A5", marginTop: 12 },
});
