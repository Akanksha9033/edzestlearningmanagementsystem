// import React, { useEffect, useState } from "react";
// import { useNavigate, useParams, Link } from "react-router-dom";
// import * as ebooksApiModule from "../api/ebooksApi";
// import { toast } from "react-toastify";

// const api = ebooksApiModule.default || ebooksApiModule;

// /**
//  * Settings page for a single E-Book.
//  * Route: /admin/ebooks/settings/:ebookid
//  * Actions:
//  *  - Publish / Unpublish
//  *  - Delete
//  */
// export default function EBookSettings() {
//   const { ebookid } = useParams();
//   const navigate = useNavigate();

//   const [loading, setLoading] = useState(true);
//   const [title, setTitle] = useState("");
//   const [slug, setSlug] = useState("");
//   const [status, setStatus] = useState("DRAFT");
//   const [saving, setSaving] = useState(false);

//   useEffect(() => {
//     (async () => {
//       try {
//         setLoading(true);
//         const res = await api.getEBookById(ebookid);
//         const data = res.data;
//         setTitle(data.title || "");
//         setSlug(data.slug || "");
//         setStatus(data.status || "DRAFT");
//       } catch (err) {
//         toast.error("Failed to load e-book settings");
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [ebookid]);

//   const publishToggle = async (publish) => {
//     try {
//       setSaving(true);
//       const newStatus = publish ? "PUBLISHED" : "DRAFT";
//       await api.updateEBook(ebookid, { status: newStatus });
//       setStatus(newStatus);
//       toast.success(publish ? "E-Book published!" : "E-Book set to draft!");
//     } catch (err) {
//       toast.error("Failed to update status: " + (err.message || "Unknown"));
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleDelete = async () => {
//     const confirmDelete = window.confirm(
//       `⚠️ Delete "${title || "this e-book"}" permanently?\nThis cannot be undone.`
//     );
//     if (!confirmDelete) return;

//     try {
//       setSaving(true);
//       await api.deleteEBook(ebookid);
//       toast.success("E-Book deleted.");
//       navigate("/admin/ebooks");
//     } catch (err) {
//       toast.error("Failed to delete e-book: " + (err.message || "Unknown"));
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (loading) return <div className="p-6">Loading settings…</div>;

//   return (
//     <div className="max-w-5xl mx-auto p-6">
//       {/* Header */}
//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <h1 className="text-2xl font-bold">Publish/Delete E-Book</h1>
//           <p className="text-gray-600">
//             Delete or disable (unpublish) the e-book for your learners
//           </p>
//           <div className="mt-2 text-sm text-gray-700">
//             <span className="font-semibold">{title || "Untitled"}</span>{" "}
//             <span className="text-gray-500">/ {slug || "—"}</span>{" "}
//             <span
//               className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
//                 status === "PUBLISHED"
//                   ? "bg-green-100 text-green-700"
//                   : "bg-yellow-100 text-yellow-700"
//               }`}
//             >
//               {status}
//             </span>
//           </div>
//         </div>

//         <Link
//           to={`/admin/ebooks/edit/${ebookid}`}
//           className="text-sm text-blue-600 hover:underline"
//         >
//           ← Back to Editor
//         </Link>
//       </div>

//       {/* Action cards (like your screenshot) */}
//       <div className="grid gap-4 md:grid-cols-2">
//         {/* Publish/Unpublish card */}
//         <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
//           <div className="flex items-start gap-3">
//             {/* simple upload icon */}
//             <div className="mt-1 grid h-9 w-9 place-items-center rounded-md border border-gray-200">
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 className="h-5 w-5 text-gray-700"
//                 viewBox="0 0 20 20"
//                 fill="currentColor"
//               >
//                 <path d="M3 14a1 1 0 011-1h3v-3h4v3h3a1 1 0 011 1v3H3v-3z" />
//                 <path d="M7 7l3-3 3 3H7z" />
//               </svg>
//             </div>
//             <div className="flex-1">
//               <h3 className="text-lg font-semibold">Publish E-Book</h3>
//               <p className="text-sm text-gray-600">
//                 Publish/Unpublish the e-book for your learners
//               </p>

//               <div className="mt-4">
//                 {status === "DRAFT" ? (
//                   <button
//                     disabled={saving}
//                     onClick={() => publishToggle(true)}
//                     className="rounded-lg bg-purple-700 px-4 py-2 text-white hover:bg-purple-800 disabled:opacity-60"
//                   >
//                     {saving ? "Publishing…" : "Publish"}
//                   </button>
//                 ) : (
//                   <button
//                     disabled={saving}
//                     onClick={() => publishToggle(false)}
//                     className="rounded-lg bg-gray-700 px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-60"
//                   >
//                     {saving ? "Updating…" : "Unpublish"}
//                   </button>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Delete card */}
//         <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
//           <div className="flex items-start gap-3">
//             {/* trash icon */}
//             <div className="mt-1 grid h-9 w-9 place-items-center rounded-md border border-gray-200">
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 className="h-5 w-5 text-red-600"
//                 viewBox="0 0 20 20"
//                 fill="currentColor"
//               >
//                 <path d="M6 7h8l-1 10H7L6 7zm3-3h2l1 1h4v2H4V5h4l1-1z" />
//               </svg>
//             </div>
//             <div className="flex-1">
//               <h3 className="text-lg font-semibold">Delete E-Book</h3>
//               <p className="text-sm text-gray-600">
//                 Delete your e-book if you no longer require it
//               </p>

//               <div className="mt-4">
//                 <button
//                   disabled={saving}
//                   onClick={handleDelete}
//                   className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-60"
//                 >
//                   {saving ? "Deleting…" : "Delete"}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }











// src/components/EBookSettings.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import * as ebooksApiModule from "../api/ebooksApi";
import { toast } from "react-toastify";

const api = ebooksApiModule.default || ebooksApiModule;

/**
 * Settings page for a single E-Book.
 * Route: /admin/ebooks/settings/:ebookid
 * Actions:
 *  - Edit basic details: Title, Slug, Description, Cover Image
 *  - Publish / Unpublish
 *  - Delete
 */
export default function EBookSettings() {
  const { ebookid } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  // const [description, setDescription] = useState(""); // ✅ NEW
  const [status, setStatus] = useState("DRAFT");
  const [saving, setSaving] = useState(false);

  // ✅ cover image edit
  const [coverImage, setCoverImage] = useState("");
  const [newCoverFile, setNewCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.getEBookById(ebookid);
        const data = res.data;
        setTitle(data.title || "");
        setSlug(data.slug || "");
        // setDescription(data.description || ""); // ✅ load
        setStatus(data.status || "DRAFT");
        setCoverImage(data.coverImage || "");
        setCoverPreview(data.coverImage || ""); // show existing cover
      } catch (err) {
        toast.error("Failed to load e-book settings");
      } finally {
        setLoading(false);
      }
    })();
  }, [ebookid]);

  const onPickCover = (e) => {
    const f = e.target.files?.[0];
    setNewCoverFile(f || null);
    if (f) setCoverPreview(URL.createObjectURL(f));
    else setCoverPreview(coverImage || "");
  };

  // ✅ Save meta (title/slug/description/cover)
  const handleSaveMeta = async () => {
    if (!title.trim() || !slug.trim()) {
      toast.error("Title and Slug are required");
      return;
    }
    try {
      setSaving(true);

      let coverURL = coverImage || "";
      if (newCoverFile) {
        const up = await api.uploadEBookImage(newCoverFile);
        coverURL = up?.data?.url || up?.data?.Location || up?.data?.secure_url || up?.data;
        if (!coverURL) throw new Error("Upload succeeded but no URL returned");
      }

      await api.updateEBook(ebookid, {
        title: title.trim(),
        slug: slug.trim(),
        // description: description.trim(),
        coverImage: coverURL || undefined,
      });

      setCoverImage(coverURL || "");
      toast.success("Details updated!");
    } catch (err) {
      toast.error("Failed to save details: " + (err?.message || "Unknown"));
    } finally {
      setSaving(false);
    }
  };

  const publishToggle = async (publish) => {
    try {
      setSaving(true);
      const newStatus = publish ? "PUBLISHED" : "DRAFT";
      await api.updateEBook(ebookid, { status: newStatus });
      setStatus(newStatus);
      toast.success(publish ? "E-Book published!" : "E-Book set to draft!");
    } catch (err) {
      toast.error("Failed to update status: " + (err.message || "Unknown"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      `⚠️ Delete "${title || "this e-book"}" permanently?\nThis cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      setSaving(true);
      await api.deleteEBook(ebookid);
      toast.success("E-Book deleted.");
      navigate("/admin/ebooks");
    } catch (err) {
      toast.error("Failed to delete e-book: " + (err.message || "Unknown"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading settings…</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">E-Book Settings</h1>
          <p className="text-gray-600">Edit details, publish/unpublish, or delete.</p>
          <div className="mt-2 text-sm text-gray-700">
            <span className="font-semibold">{title || "Untitled"}</span>{" "}
            <span className="text-gray-500">/ {slug || "—"}</span>{" "}
            <span
              className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                status === "PUBLISHED"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {status}
            </span>
          </div>
        </div>

        <Link
          to={`/admin/ebooks/edit/${ebookid}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Editor
        </Link>
      </div>

      {/* ✅ Details card */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm mb-5">
        <div className="flex items-start gap-3">
          <div className="mt-1 grid h-9 w-9 place-items-center rounded-md border border-gray-200">
            {/* pencil icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-700"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-9.9 9.9a1 1 0 01-.464.263l-3 0.75a1 1 0 01-1.213-1.213l.75-3a1 1 0 01.263-.464l9.9-9.9zM12 5l3 3" />
            </svg>
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold">Basic Details</h3>
            <p className="text-sm text-gray-600">
              Update title, slug,and cover image.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1">Title</label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E-Book title"
                />
              </div>

              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1">Slug</label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="unique-slug"
                />
              </div>

              {/* <div className="md:col-span-2">
                <label className="block text-xs uppercase text-gray-500 mb-1">Description</label>
                <textarea
                  className="w-full min-h-[110px] rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description shown in listings"
                />
              </div> */}

              {/* Cover image upload + preview */}
              <div className="md:col-span-2">
                <label className="block text-xs uppercase text-gray-500 mb-1">
                  Cover Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onPickCover}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />

                <div className="mt-3 flex items-center gap-12">
                  <div className="text-sm text-gray-600">
                    Current URL:{" "}
                    <span className="text-gray-800">{coverImage || "—"}</span>
                  </div>
                  {coverPreview ? (
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="h-24 w-24 object-cover rounded-lg border border-gray-200 shadow-sm"
                    />
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <button
                disabled={saving}
                onClick={handleSaveMeta}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action cards (publish / delete) */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Publish/Unpublish card */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            {/* simple upload icon */}
            <div className="mt-1 grid h-9 w-9 place-items-center rounded-md border border-gray-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-700"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M3 14a1 1 0 011-1h3v-3h4v3h3a1 1 0 011 1v3H3v-3z" />
                <path d="M7 7l3-3 3 3H7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Publish E-Book</h3>
              <p className="text-sm text-gray-600">
                Publish/Unpublish the e-book for your learners
              </p>

              <div className="mt-4">
                {status === "DRAFT" ? (
                  <button
                    disabled={saving}
                    onClick={() => publishToggle(true)}
                    className="rounded-lg bg-purple-700 px-4 py-2 text-white hover:bg-purple-800 disabled:opacity-60"
                  >
                    {saving ? "Publishing…" : "Publish"}
                  </button>
                ) : (
                  <button
                    disabled={saving}
                    onClick={() => publishToggle(false)}
                    className="rounded-lg bg-gray-700 px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-60"
                  >
                    {saving ? "Updating…" : "Unpublish"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delete card */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            {/* trash icon */}
            <div className="mt-1 grid h-9 w-9 place-items-center rounded-md border border-gray-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-red-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M6 7h8l-1 10H7L6 7zm3-3h2l1 1h4v2H4V5h4l1-1z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Delete E-Book</h3>
              <p className="text-sm text-gray-600">
                Delete your e-book if you no longer require it
              </p>

              <div className="mt-4">
                <button
                  disabled={saving}
                  onClick={handleDelete}
                  className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {saving ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
