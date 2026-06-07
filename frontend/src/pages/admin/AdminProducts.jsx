import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, ToggleLeft, ToggleRight, Trash2, Server, Code, DollarSign, X, Check, UploadCloud 
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import { toast } from "sonner";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

function FileUploadZone({ label, accept, onFileSelected, previewUrl, type }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(previewUrl || "");

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await handleFile(file);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await handleFile(file);
    }
  };

  const handleFile = async (file) => {
    const ext = file.name.split(".").pop().toLowerCase();
    const isVideo = ext === "mp4" || ext === "webm" || ext === "mov";
    const isImage = ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "webp" || ext === "gif";

    if (type === "video" && !isVideo) {
      toast.error("Please upload a valid video file (MP4, WebM, MOV).");
      return;
    }
    if (type === "image" && !isImage) {
      toast.error("Please upload a valid image file (PNG, JPG, JPEG, WEBP, GIF).");
      return;
    }

    const maxSize = type === "video" ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File size exceeds limit (${type === "video" ? "100MB" : "10MB"})`);
      return;
    }

    setFileName(file.name);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${apiBaseUrl}/api/admin/media/upload`, {
        method: "POST",
        credentials: "include",
        body: formData
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Upload failed");
      }

      const data = await res.json();
      setUploadedUrl(data.url);
      onFileSelected(data.url);
      toast.success(`${label} uploaded successfully!`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`relative rounded-xl border-2 border-dashed p-4 text-center transition-all min-h-[100px] flex flex-col justify-center items-center ${
        isDragActive 
          ? "border-indigo-500 bg-indigo-500/10" 
          : uploadedUrl 
          ? "border-emerald-500/40 bg-emerald-500/5" 
          : "border-slate-700 bg-slate-900/40 hover:border-slate-600"
      }`}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        disabled={uploading}
      />
      {uploading ? (
        <div className="space-y-2 py-1">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[10px] text-slate-400 font-semibold">Uploading {fileName || "file"}...</p>
        </div>
      ) : uploadedUrl ? (
        <div className="space-y-2 z-20">
          {type === "image" ? (
            <img src={uploadedUrl} className="mx-auto h-16 object-contain rounded border border-slate-700" alt="Preview" />
          ) : (
            <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-semibold text-xs">
              <Check size={14} /> Video Uploaded
            </div>
          )}
          <p className="text-[9px] text-slate-500 truncate max-w-[200px] mx-auto">{uploadedUrl}</p>
          <button 
            type="button" 
            onClick={(e) => {
              e.preventDefault();
              setUploadedUrl("");
              onFileSelected("");
              setFileName("");
            }}
            className="text-[9px] text-red-400 underline hover:text-red-300 pointer-events-auto"
          >
            Remove file
          </button>
        </div>
      ) : (
        <div className="space-y-1 py-1">
          <UploadCloud size={20} className="text-slate-500 mx-auto" />
          <p className="text-[11px] font-bold text-slate-300">Drag & Drop {label}</p>
          <p className="text-[9px] text-slate-500">or click to browse ({type === "video" ? "MP4/WebM/MOV up to 100MB" : "PNG/JPG/WEBP up to 10MB"})</p>
        </div>
      )}
    </div>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dynamic features list
  const [features, setFeatures] = useState([
    { name: "Real-Time Analytics", description: "Live reporting dashboard" },
    { name: "Automated Alerts", description: "Slack & Email notifications" }
  ]);

  // Form state
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    category: "AUTOMATION",
    demoUrl: "",
    dockerImage: "",
    status: "DRAFT",
    features: "",
    techStack: "",
    videoUrl: "",
    screenshots: "",
    deploymentTemplate: "",
    repositoryInfo: ""
  });

  useEffect(() => {
    fetch(`${apiBaseUrl}/api/users/me`, { credentials: "include" })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed to load user profile");
      })
      .then((data) => {
        setTenantId(data.tenantId);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Authentication error. Please login again.");
      });

    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/products`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      } else {
        toast.error("Failed to load product catalog.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error while loading products.");
    } finally {
      setLoading(false);
    }
  }

  function handleNameChange(nameVal) {
    const slugVal = nameVal
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    
    setForm((prev) => ({
      ...prev,
      name: nameVal,
      slug: slugVal
    }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!tenantId) {
      toast.error("Tenant ID is loading. Please try again in a moment.");
      return;
    }
    if (!form.name || !form.slug || !form.price) {
      toast.error("Name, Slug, and Price are required fields.");
      return;
    }
    if (!form.screenshots) {
      toast.error("Please upload a Thumbnail Image.");
      return;
    }
    if (!form.videoUrl) {
      toast.error("Please upload a Demo Video.");
      return;
    }

    // Serialize dynamic features rows
    const serializedFeatures = features
      .filter((f) => f.name.trim())
      .map((f) => `${f.name.trim()}: ${f.description.trim()}`)
      .join("\n");

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/products`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          features: serializedFeatures,
          tenantId: tenantId,
          price: Number(form.price)
        })
      });

      if (res.ok) {
        toast.success("Product successfully created!");
        setIsModalOpen(false);
        // Reset form
        setForm({
          name: "",
          slug: "",
          description: "",
          price: "",
          category: "AUTOMATION",
          demoUrl: "",
          dockerImage: "",
          status: "DRAFT",
          features: "",
          techStack: "",
          videoUrl: "",
          screenshots: "",
          deploymentTemplate: "",
          repositoryInfo: ""
        });
        setFeatures([
          { name: "Real-Time Analytics", description: "Live reporting dashboard" },
          { name: "Automated Alerts", description: "Slack & Email notifications" }
        ]);
        loadProducts();
      } else {
        const data = await res.json();
        toast.error(data?.message || "Failed to create product.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to make creation request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleTogglePublish(product) {
    const isPublished = product.status === "ACTIVE";
    const endpoint = isPublished ? "unpublish" : "publish";
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/products/${product.id}/${endpoint}`, {
        method: "POST",
        credentials: "include"
      });
      if (res.ok) {
        toast.success(`Product ${isPublished ? "unpublished" : "published"} successfully!`);
        loadProducts();
      } else {
        toast.error("Action failed.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Request failed.");
    }
  }

  async function handleDelete(productId) {
    if (!window.confirm("Are you sure you want to delete/archive this product?")) return;

    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/products/${productId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.status === 204 || res.ok) {
        toast.success("Product successfully deleted!");
        loadProducts();
      } else {
        toast.error("Deletion failed.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Request failed.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#E05C3A] mb-1">
            Catalog Management
          </p>
          <h2 className="text-2xl font-black text-white">Products Catalog</h2>
          <p className="mt-1 text-sm text-slate-400">
            Create and manage deployable AI marketplace products.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1">
          <Plus size={16} /> Add Product
        </Button>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="py-24 text-center text-slate-500 animate-pulse text-sm">Loading catalog...</div>
      ) : products.length === 0 ? (
        <Card className="border-slate-800 bg-[#141A28]">
          <CardContent className="py-12 text-center text-slate-400 text-sm">
            No products found in the catalog. Click "Add Product" to create your first product.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="border-slate-800 bg-[#1E293B] hover:border-slate-700/80 transition-colors">
              <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white">{product.name}</h3>
                    <span className="text-xs font-mono text-slate-500">/{product.slug}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      product.status === "ACTIVE" 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : product.status === "DRAFT"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                    }`}>
                      {product.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">{product.description}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1"><DollarSign size={13} className="text-[#E05C3A]" />{product.price}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-semibold">{product.category}</span>
                    {product.dockerImage && <span className="flex items-center gap-1 text-[11px]"><Server size={11} />{product.dockerImage}</span>}
                    {product.repositoryInfo && <span className="flex items-center gap-1 text-[11px]"><Code size={11} />{product.repositoryInfo}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleTogglePublish(product)}
                    className="border-slate-700 hover:bg-slate-800 text-slate-300 flex items-center gap-1.5"
                  >
                    {product.status === "ACTIVE" ? (
                      <>
                        <ToggleRight className="text-emerald-400" size={16} /> Unpublish
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="text-slate-500" size={16} /> Publish
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                    className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 flex items-center gap-1.5"
                  >
                    <Trash2 size={15} /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Product Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#0F172A] p-6 shadow-2xl space-y-6 my-8"
            >
              {/* Modal Head */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-['Space_Grotesk'] text-xl font-bold text-white">Add New Marketplace Product</h3>
                  <p className="text-xs text-slate-400">Fill in details. Security and DB constraints apply.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Product Name *</label>
                    <Input 
                      required
                      value={form.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Chatbot Pro"
                      className="bg-[#1E293B] border-slate-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Product Slug *</label>
                    <Input 
                      required
                      value={form.slug}
                      onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                      placeholder="e.g. chatbot-pro"
                      className="bg-[#1E293B] border-slate-700 text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Price (USD) *</label>
                    <Input 
                      required
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="e.g. 199"
                      className="bg-[#1E293B] border-slate-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Category *</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full h-10 rounded-lg border border-slate-700 bg-[#1E293B] px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="AI_WEBSITE">AI_WEBSITE</option>
                      <option value="AUTOMATION">AUTOMATION</option>
                      <option value="CRM">CRM</option>
                      <option value="CHATBOT">CHATBOT</option>
                      <option value="TEMPLATE">TEMPLATE</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter customer-facing marketing description..."
                    className="w-full rounded-lg border border-slate-700 bg-[#1E293B] p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Drag and Drop File Uploaders */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Thumbnail Image *</label>
                    <FileUploadZone
                      label="Thumbnail Image"
                      accept="image/*"
                      type="image"
                      previewUrl={form.screenshots}
                      onFileSelected={(url) => setForm((prev) => ({ ...prev, screenshots: url }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Demo Video *</label>
                    <FileUploadZone
                      label="Demo Video"
                      accept="video/*"
                      type="video"
                      previewUrl={form.videoUrl}
                      onFileSelected={(url) => setForm((prev) => ({ ...prev, videoUrl: url }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Tech Stack (comma-separated)</label>
                    <Input 
                      value={form.techStack}
                      onChange={(e) => setForm(prev => ({ ...prev, techStack: e.target.value }))}
                      placeholder="e.g. React, Spring Boot, Ollama"
                      className="bg-[#1E293B] border-slate-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Try Demo URL</label>
                    <Input 
                      value={form.demoUrl}
                      onChange={(e) => setForm(prev => ({ ...prev, demoUrl: e.target.value }))}
                      placeholder="e.g. /demo/chatbot-pro"
                      className="bg-[#1E293B] border-slate-700 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Docker Image</label>
                    <Input 
                      value={form.dockerImage}
                      onChange={(e) => setForm(prev => ({ ...prev, dockerImage: e.target.value }))}
                      placeholder="e.g. organization/agent:latest"
                      className="bg-[#1E293B] border-slate-700 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Repository Info</label>
                    <Input 
                      value={form.repositoryInfo}
                      onChange={(e) => setForm(prev => ({ ...prev, repositoryInfo: e.target.value }))}
                      placeholder="e.g. github.com/username/repo"
                      className="bg-[#1E293B] border-slate-700 text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Initial Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full h-10 rounded-lg border border-slate-700 bg-[#1E293B] px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="DRAFT">DRAFT (Hidden)</option>
                      <option value="ACTIVE">ACTIVE (Published)</option>
                    </select>
                  </div>
                </div>

                {/* Dynamic Features rows */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase text-slate-400">Features List *</label>
                    <Button 
                      type="button" 
                      onClick={() => setFeatures([...features, { name: "", description: "" }])}
                      size="sm" 
                      className="h-7 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-[10px]"
                    >
                      <Plus size={10} /> Add Feature
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {features.map((feat, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input
                          required
                          value={feat.name}
                          onChange={(e) => {
                            const newFeats = [...features];
                            newFeats[idx].name = e.target.value;
                            setFeatures(newFeats);
                          }}
                          placeholder="Feature Name (e.g. Real-Time Analytics)"
                          className="bg-[#1E293B] border-slate-700 text-xs flex-1"
                        />
                        <Input
                          required
                          value={feat.description}
                          onChange={(e) => {
                            const newFeats = [...features];
                            newFeats[idx].description = e.target.value;
                            setFeatures(newFeats);
                          }}
                          placeholder="Feature Description (e.g. Live reporting dashboard)"
                          className="bg-[#1E293B] border-slate-700 text-xs flex-[2]"
                        />
                        {features.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setFeatures(features.filter((_, i) => i !== idx))}
                            className="text-red-400 hover:text-red-300 p-1.5"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-800">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white flex-1"
                  >
                    {isSubmitting ? "Creating..." : "Create Product"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsModalOpen(false)}
                    className="border-slate-700 hover:bg-slate-800 text-slate-300 flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
