export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
    <section>
      <header>
        <h1>Dashboard</h1>
      </header>
      <main>{children}</main>
    </section>
    </>
  )
}