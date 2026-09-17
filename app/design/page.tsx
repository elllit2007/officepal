import DesignGallery from "./DesignGallery";

export const metadata = {
  title: "Designsystem",
};

/**
 * Levande referens för OfficePals designsystem. Se DESIGN-SYSTEM.md.
 * Skyddad som övriga admin-vyer (kräver inloggning).
 */
export default function DesignPage() {
  return (
    <main className="flex-1">
      <DesignGallery />
    </main>
  );
}
