import "tokiline/style.css"

export const metadata = {
  title: "tokiline example",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
