import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface FiltersProps {
  filters: any;
  handleFilterChange: (field: string, value: any) => void;
  removeFilter: (key: string) => void;
  clearAllFilters: () => void;
  filterDisplayNames: Record<string, string>;
  statuses: Record<string, string>;
}

const ValidationFilters: React.FC<FiltersProps> = ({
  filters,
  handleFilterChange,
  removeFilter,
  clearAllFilters,
  filterDisplayNames,
  statuses,
}) => {
  return (
    <>
      <section className="mb-4 rounded-sm border border-[#adcdff] bg-[#edf5ff] p-4" aria-label="Filtros de atividades">
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Select
          onValueChange={(value) => handleFilterChange("status", value)}
          value={filters.status}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="approved">Aprovado</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="rejected">Rejeitado</SelectItem>
            <SelectItem value="archived">Arquivado</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Descrição"
          value={filters.description}
          onChange={(e) => handleFilterChange("description", e.target.value)}
        />
        <Input
          type="text"
          placeholder="Nome do aluno"
          value={filters.user}
          onChange={(e) => handleFilterChange("user", e.target.value)}
        />
        <Input
          type="date"
          placeholder="Data de envio"
          value={filters.createdAt}
          onChange={(e) => handleFilterChange("createdAt", e.target.value)}
        />
        <Input
          placeholder="Carga Horária"
          value={filters.workload}
          onChange={(e) => handleFilterChange("workload", e.target.value)}
        />

<div className="flex min-h-11 items-center gap-3 rounded-sm border border-[#cccccc] bg-white px-3">
        <Checkbox id="includeArchived" checked={filters.includeArchived} onCheckedChange={value => handleFilterChange("includeArchived", value as boolean)} />
        <Label htmlFor="includeArchived">Incluir arquivados</Label>
      </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-2 justify-start items-center">
        {(Object.keys(filters) as (keyof typeof filters)[]).map((key) => {
          const keyStr = String(key);
          if (
            filters[key] &&
            (keyStr !== "status" || filters["status"] !== "all")
          ) {
            return (
              <Badge
                key={keyStr}
                variant="secondary"
                className="flex min-h-7 items-center px-3 py-1 text-xs font-medium"
              >
                <span>
                  {`
                  ${filterDisplayNames[keyStr] || keyStr}: 
                  ${
                    keyStr === "createdAt"
                      ? filters[keyStr].split("-").reverse().join("/")
                      : typeof filters[keyStr] === "string"
                        ? statuses[filters[keyStr]] || filters[keyStr]
                        : filters[keyStr] ? "Sim" : "Não"
                  }
                `}
                </span>
                <button
                  onClick={() => removeFilter(keyStr)}
                  className="ml-3 text-[#1351b4]"
                  aria-label={`Remover filtro ${filterDisplayNames[keyStr] || keyStr}`}
                >
                  ✕
                </button>
              </Badge>
            );
          }
          return null;
        })}
        {Object.keys(filters).some(
          (key) =>
            filters[key as keyof typeof filters] &&
            (String(key) !== "status" || filters["status"] !== "all")
        ) && (
          <Button
            onClick={clearAllFilters}
            className="min-h-8 px-3 py-1 text-xs font-medium"
            variant={"destructive"}
          >
            Remover todos
          </Button>
        )}
      </div>
      </section>
    </>
  );
};

export default React.memo(ValidationFilters); 
