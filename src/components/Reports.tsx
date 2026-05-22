import { Download, Calendar } from 'lucide-react';

export default function Reports() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
          <p className="text-gray-500 font-medium">Análise detalhada do seu negócio.</p>
        </div>
        <button
          className="bg-white border border-[#E4E3E0] text-[#141414] px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all shadow-sm"
        >
          <Download size={20} />
          Exportar PDF
        </button>
      </header>

      <div className="bg-white rounded-2xl border border-[#E4E3E0] p-12 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6">
          <Calendar size={40} />
        </div>
        <h3 className="text-xl font-bold mb-2">Relatórios Detalhados</h3>
        <p className="text-gray-500 max-w-sm">
          Estamos processando seus dados para gerar relatórios de lucratividade por produto e sazonalidade. Volte em breve!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ReportCard 
          title="Top Produtos" 
          description="Os 5 produtos mais vendidos este mês."
        />
        <ReportCard 
          title="Projeção de Lucro" 
          description="Estimativa baseada no seu estoque atual e histórico."
        />
      </div>
    </div>
  );
}

function ReportCard({ title, description }: any) {
  return (
    <div className="p-8 bg-white rounded-2xl border border-[#E4E3E0] shadow-sm">
      <h4 className="font-bold text-lg mb-2">{title}</h4>
      <p className="text-sm text-gray-500 mb-6">{description}</p>
      <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-[#141414] w-[65%]" />
      </div>
    </div>
  );
}
