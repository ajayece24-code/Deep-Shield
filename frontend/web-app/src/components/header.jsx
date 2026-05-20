function Header() {
  return (
    <header className="bg-gray-900 text-white py-5 px-6 flex items-center gap-3">
      <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-lg">D</div>
      <div>
        <h1 className="text-xl font-semibold">DeepShield</h1>
        <p className="text-xs text-gray-400">Real-time deepfake detection</p>
      </div>
    </header>
  )
}
export default Header