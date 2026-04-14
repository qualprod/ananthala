"use client"

import { useMemo, useState, useEffect } from "react"
import { Plus, RefreshCw, Trash2, Loader2, Pencil, Gift, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import AddProductModal from "@/components/admin/add-product-modal"
import ManageComplementaryProductsModal from "@/components/admin/manage-complementary-products-modal"

interface Product {
  _id: string
  productType?: "single" | "hamper"
  productTitle: string
  category: string
  subCategory: string
  hamperPrice?: number
  productRole?: "normal" | "complementary"
  variants: Array<{
    variantId: string
    weight: number
    dimensions: {
      length: number
      width: number
      height: number
    }
    price: number
    stock: number
  }>
  hamperItems?: Array<{
    name?: string
    imageUrls?: string[]
    variants?: Array<{
      weight?: number
      length?: number
      width?: number
      height?: number
      stock?: number
    }>
  }>
  imageUrls: string[]
  detailSections?: Array<{
    title?: string
    body?: string
    imageUrl?: string
    imageAlt?: string
    imagePosition?: "left" | "right"
  }>
  complementaryProductIds?: string[]
  displayOrder?: number | null
  createdAt?: string
  status: "visible" | "hidden"
  sellerName: string
  sellerEmail: string
  location: string
  description: string
  units: string
}

export default function ProductManagementPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [isComplementaryModalOpen, setIsComplementaryModalOpen] = useState(false)
  const [selectedProductForComplementary, setSelectedProductForComplementary] = useState<Product | null>(null)
  const [isReorderMode, setIsReorderMode] = useState(false)
  const [reorderProducts, setReorderProducts] = useState<Product[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [orderMessage, setOrderMessage] = useState<string | null>(null)

  const fetchProducts = async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch("/api/products")
      const data = await response.json()

      if (data.success) {
        setProducts(data.products)
        console.log("[v0] Fetched", data.products.length, "products")
      }
    } catch (error) {
      console.error("[v0] Error fetching products:", error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleRefresh = () => {
    fetchProducts()
  }

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return
    }

    try {
      console.log("[v0] Deleting product:", productId)

      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      console.log("[v0] Delete response:", data)

      if (data.success) {
        setProducts((prev) => prev.filter((p) => p._id !== productId))
        console.log("[v0] Product deleted successfully from UI")
        alert("Product deleted successfully!")
      } else {
        console.error("[v0] Failed to delete product:", data.message)
        alert(data.message || "Failed to delete product")
      }
    } catch (error) {
      console.error("[v0] Error deleting product:", error)
      alert("Failed to delete product. Please try again.")
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setIsAddModalOpen(true)
  }

  const handleModalClose = () => {
    setIsAddModalOpen(false)
    setEditingProduct(null)
  }

  const handleSaveComplementaryProducts = async (selectedIds: string[]) => {
    if (!selectedProductForComplementary) return

    try {
      const response = await fetch("/api/products/complementary", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedProductForComplementary._id,
          complementaryProductIds: selectedIds,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert("Complementary products updated successfully!")
        // Refresh the products list
        fetchProducts()
      } else {
        alert(data.message || "Failed to update complementary products")
      }
    } catch (error) {
      console.error("[v0] Error saving complementary products:", error)
      alert("Failed to save complementary products")
    }
  }

  const handleManageComplementary = (product: Product) => {
    setSelectedProductForComplementary(product)
    setIsComplementaryModalOpen(true)
  }

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") return products
    return products.filter((p) => p.category === selectedCategory.toLowerCase())
  }, [products, selectedCategory])

  const sortByDisplayOrder = (items: Product[]) =>
    [...items].sort((a, b) => {
      const aOrder = typeof a.displayOrder === "number" ? a.displayOrder : Number.POSITIVE_INFINITY
      const bOrder = typeof b.displayOrder === "number" ? b.displayOrder : Number.POSITIVE_INFINITY
      if (aOrder !== bOrder) return aOrder - bOrder
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return bTime - aTime
    })

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory])

  useEffect(() => {
    if (selectedCategory === "all") {
      setIsReorderMode(false)
      setReorderProducts([])
      return
    }
    setReorderProducts(sortByDisplayOrder(filteredProducts))
  }, [filteredProducts, selectedCategory])

  const handleDragStart = (index: number) => {
    setDragIndex(index)
  }

  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null)
      return
    }
    const updated = [...reorderProducts]
    const [moved] = updated.splice(dragIndex, 1)
    updated.splice(index, 0, moved)
    setReorderProducts(updated)
    setDragIndex(null)
  }

  const handleSaveOrder = async () => {
    if (selectedCategory === "all" || reorderProducts.length === 0) return
    try {
      setIsSavingOrder(true)
      setOrderMessage(null)
      const orderedIds = reorderProducts.map((product) => product._id)
      const response = await fetch("/api/products/order", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: selectedCategory, orderedIds }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update order")
      }
      const orderMap = new Map(orderedIds.map((id, index) => [id, index + 1]))
      setProducts((prev) =>
        prev.map((product) =>
          product.category === selectedCategory
            ? { ...product, displayOrder: orderMap.get(product._id) ?? product.displayOrder }
            : product,
        ),
      )
      setOrderMessage("Order saved successfully.")
    } catch (error: any) {
      setOrderMessage(error.message || "Failed to save order.")
    } finally {
      setIsSavingOrder(false)
    }
  }

  const getProductStats = (product: Product) => {
    const isHamper = product.productType === "hamper"
    if (isHamper) {
      const hamperItems = Array.isArray(product.hamperItems) ? product.hamperItems : []
      const variantsCount = hamperItems.reduce((sum, item) => sum + ((item.variants || []).length || 0), 0)
      const totalStock = hamperItems.reduce(
        (sum, item) =>
          sum + (item.variants || []).reduce((innerSum, v) => innerSum + (Number(v.stock) || 0), 0),
        0,
      )
      const basePrice = Number(product.hamperPrice) || 0
      return { totalStock, basePrice, variantsCount }
    }

    const variantsCount = product.variants.length
    const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0)
    const basePrice = product.variants.length > 0 ? product.variants[0].price : 0
    return { totalStock, basePrice, variantsCount }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#4A2F1F]">Product Management</h1>
      </div>

      {/* Product Stock Section */}
      <div className="bg-white rounded-lg shadow-sm border border-[#D9CFC7] p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-[#4A2F1F]">
            Product Stock ({filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""})
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px] border-[#D9CFC7]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="joy">JOY</SelectItem>
                 <SelectItem value="bliss">Bliss</SelectItem>
                <SelectItem value="grace">Grace</SelectItem>
                <SelectItem value="pillow">Pillow</SelectItem>
                <SelectItem value="bedding">Bedding</SelectItem>
                <SelectItem value="bedsheet">Bedsheet</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="border-[#D9CFC7] text-[#4A2F1F] hover:bg-[#8B5A3C]/10 bg-transparent font-medium"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            <Button
              className="bg-black text-white hover:bg-black/90 font-medium"
              onClick={() => {
                setEditingProduct(null)
                setIsAddModalOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {selectedCategory !== "all" && (
          <div className="mb-6 rounded-lg border border-[#D9CFC7] bg-[#F9F6F2] p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-[#4A2F1F] capitalize">
                  Reorder {selectedCategory} products
                </h3>
                <p className="text-sm text-foreground">
                  Drag and drop to set the order shown on the category page, then save.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  className="border-[#D9CFC7] text-[#4A2F1F] hover:bg-[#8B5A3C]/10 bg-transparent font-medium"
                  onClick={() => setIsReorderMode((prev) => !prev)}
                  disabled={reorderProducts.length === 0}
                >
                  {isReorderMode ? "Close Reorder" : "Reorder Products"}
                </Button>
                {isReorderMode && (
                  <Button
                    className="bg-black text-white hover:bg-black/90 font-medium"
                    onClick={handleSaveOrder}
                    disabled={isSavingOrder || reorderProducts.length === 0}
                  >
                    {isSavingOrder ? "Saving..." : "Save Order"}
                  </Button>
                )}
              </div>
            </div>
            {orderMessage && <p className="mt-3 text-sm text-[#4A2F1F]">{orderMessage}</p>}
            {isReorderMode && (
              <div className="mt-4 space-y-2">
                {reorderProducts.map((product, index) => (
                  <div
                    key={product._id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={() => setDragIndex(null)}
                    className={`flex items-center gap-3 rounded-md border border-[#D9CFC7] bg-white p-3 ${
                      dragIndex === index ? "opacity-60" : ""
                    }`}
                  >
                    <GripVertical className="h-4 w-4 text-foreground cursor-grab" />
                    <img
                      src={product.imageUrls[0] || "/placeholder.svg"}
                      alt={product.productTitle}
                      className="w-10 h-10 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[#4A2F1F] truncate">{product.productTitle}</div>
                      <div className="text-xs text-foreground">Position {index + 1}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D9CFC7]">
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#4A2F1F]">Product Image</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#4A2F1F]">Category</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#4A2F1F]">Product Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#4A2F1F]">Product Type</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#4A2F1F]">Role</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#4A2F1F]">Variants</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#4A2F1F]">Total Stock</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#4A2F1F]">Base Price (₹)</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#4A2F1F]">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product) => {
                const { totalStock, basePrice, variantsCount } = getProductStats(product)
                return (
                  <tr key={product._id} className="border-b border-[#D9CFC7] hover:bg-[#F5F1ED]/50">
                    <td className="py-4 px-4">
                      <img
                        src={product.imageUrls[0] || "/placeholder.svg"}
                        alt={product.productTitle}
                        className="w-12 h-12 object-cover rounded"
                      />
                    </td>
                    <td className="py-4 px-4 text-foreground font-medium capitalize">{product.category}</td>
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-semibold text-[#4A2F1F]">{product.productTitle}</div>
                        {product.subCategory && (
                          <div className="text-sm text-foreground mt-0.5">{product.subCategory}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-[#4A2F1F] font-medium">
                      <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${
                        product.productType === "hamper"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {product.productType || "Single"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[#4A2F1F] font-medium">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        product.productRole === "complementary"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {product.productRole === "complementary" ? "Complementary" : "Normal"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[#4A2F1F] font-medium">{variantsCount}</td>
                    <td className="py-4 px-4 text-[#4A2F1F] font-medium">{totalStock}</td>
                    <td className="py-4 px-4 text-[#4A2F1F] font-semibold">₹{basePrice.toLocaleString()}</td>
                    <td className="py-4 px-4">
                      {product.productRole !== "complementary" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#4A2F1F] hover:bg-[#F5F1ED] mr-1"
                          title="Manage Complementary Products"
                          onClick={() => handleManageComplementary(product)}
                        >
                          <Gift className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[#4A2F1F] hover:bg-[#F5F1ED] mr-1"
                        onClick={() => handleEdit(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:bg-red-50"
                        onClick={() => handleDelete(product._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden space-y-4">
          {paginatedProducts.map((product) => {
            const { totalStock, basePrice, variantsCount } = getProductStats(product)
            return (
              <div key={product._id} className="border border-[#D9CFC7] rounded-lg p-4 space-y-3">
                <div className="flex gap-3">
                  <img
                    src={product.imageUrls[0] || "/placeholder.svg"}
                    alt={product.productTitle}
                    className="w-16 h-16 object-cover rounded flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#4A2F1F] truncate">{product.productTitle}</h3>
                    <p className="text-sm text-foreground font-medium capitalize">{product.category}</p>
                    <p className="text-sm text-foreground">{variantsCount} variants</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-foreground">Type:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold inline-block capitalize ${
                      product.productType === "hamper"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {product.productType || "Single"}
                    </span>
                  </div>
                  <div>
                    <span className="text-foreground">Role:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold inline-block ${
                      product.productRole === "complementary"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {product.productRole === "complementary" ? "Complementary" : "Normal"}
                    </span>
                  </div>
                  <div>
                    <span className="text-foreground">Total Stock:</span>
                    <span className="ml-2 font-semibold text-[#4A2F1F]">{totalStock}</span>
                  </div>
                  <div>
                    <span className="text-foreground">Base Price:</span>
                    <span className="ml-2 font-semibold text-[#4A2F1F]">₹{basePrice.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-[#D9CFC7]">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[#4A2F1F] hover:bg-[#F5F1ED] mr-1"
                    title="Manage Complementary Products"
                    onClick={() => handleManageComplementary(product)}
                  >
                    <Gift className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[#4A2F1F] hover:bg-[#F5F1ED] mr-1"
                    onClick={() => handleEdit(product)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:bg-red-50"
                    onClick={() => handleDelete(product._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-foreground font-medium">
              {selectedCategory === "all"
                ? "No products found. Add your first product to get started!"
                : `No ${selectedCategory} products found.`}
            </p>
          </div>
        )}

        {/* Pagination */}
        {filteredProducts.length > 0 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#D9CFC7]">
            <p className="text-sm text-[#4A2F1F] font-medium">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="border-[#D9CFC7] text-[#4A2F1F] disabled:opacity-50"
              >
                Previous
              </Button>
              <span className="text-sm text-[#4A2F1F] font-medium px-3">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="border-[#D9CFC7] text-[#4A2F1F] disabled:opacity-50"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={handleModalClose}
        onProductAdded={fetchProducts}
        mode={editingProduct ? "edit" : "create"}
        productToEdit={editingProduct}
      />

      {/* Manage Complementary Products Modal */}
      {selectedProductForComplementary && (
        <ManageComplementaryProductsModal
          isOpen={isComplementaryModalOpen}
          productId={selectedProductForComplementary._id}
          productTitle={selectedProductForComplementary.productTitle}
          onClose={() => {
            setIsComplementaryModalOpen(false)
            setSelectedProductForComplementary(null)
          }}
          onSave={handleSaveComplementaryProducts}
          currentComplementaryIds={selectedProductForComplementary.complementaryProductIds || []}
        />
      )}
    </div>
  )
}
