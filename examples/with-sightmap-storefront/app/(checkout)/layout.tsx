// A route-group layout: checkout and the order pages share this shell, the
// shop pages do not. `sightmap-next seed` records it in each view's
// `dependencies:` as part of the layout chain.
export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-component="CheckoutShell">
      <p data-component="SecureBanner">🔒 Secure checkout · nothing here is real</p>
      {children}
    </div>
  );
}
