import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { ArrowUpRight, ShoppingCart } from "lucide-react-native";
import { colors, radius } from "../theme.js";

export default function ProductDetailScreen({ route }) {
  const product = route.params?.product;

  if (!product) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Product not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.category}>{product.category}</Text>
        <Text style={styles.title}>{product.name}</Text>
        <Text style={styles.description}>{product.description}</Text>
        <Text style={styles.price}>₹{Number(product.price).toLocaleString("en-IN")}</Text>
        {product.demoUrl ? (
          <Pressable style={styles.secondaryButton} onPress={() => Linking.openURL(product.demoUrl)}>
            <ArrowUpRight color={colors.text} size={18} />
            <Text style={styles.buttonText}>Open demo</Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.primaryButton}>
          <ShoppingCart color={colors.text} size={18} />
          <Text style={styles.buttonText}>Purchase on web</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.navy, padding: 16 },
  card: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel, borderRadius: radius.card, padding: 18 },
  category: { color: colors.brand, fontWeight: "800", fontSize: 12 },
  title: { color: colors.text, fontSize: 28, fontWeight: "900", marginTop: 10 },
  description: { color: colors.muted, marginTop: 14, lineHeight: 22 },
  price: { color: colors.text, fontSize: 32, fontWeight: "900", marginVertical: 18 },
  primaryButton: { height: 48, borderRadius: radius.control, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  secondaryButton: { height: 48, borderRadius: radius.control, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginBottom: 10 },
  buttonText: { color: colors.text, fontWeight: "800" },
});
