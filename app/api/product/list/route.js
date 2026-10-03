import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { logError } from "@/lib/logger";
import { hasRecentAudit, logAudit } from "@/lib/audit";
import { getCatalogProducts } from "@/lib/catalogProducts";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const { searchParams } = new URL(request.url);
    const filters = Object.fromEntries(searchParams);
    const products = await getCatalogProducts(filters);

    // Logging must never hold the public catalog response open.
    void (async () => {
      const auditKey = userId || "anonymous";
      if (!await hasRecentAudit("product.listed", auditKey, 5)) {
        await logAudit("product.listed", "product", userId || "", "", {
          count: products.length,
          search: filters.search || null,
          category: filters.category || null,
        });
      }
    })().catch((error) => console.error("[product/list] audit logging failed:", error));

    return NextResponse.json(
      { success: true, products },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } },
    );
  } catch (error) {
    await logError("/api/product/list", error, "", {}, "error", "api", 500);
    return NextResponse.json({ success: false, message: "Failed to fetch products" }, { status: 500 });
  }
}
