// app/admin-dashboard.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { 
  Alert,
  Dimensions, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View,
  ActivityIndicator,
  RefreshControl,
  Image
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminDashboardScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  const [adminData, setAdminData] = useState<any>(null);
  const [operadores, setOperadores] = useState<any[]>([]);
  const [operadorSelecionado, setOperadorSelecionado] = useState<any>(null);
  const [buscaOperador, setBuscaOperador] = useState('');
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [carregandoOperadores, setCarregandoOperadores] = useState(true);
  const [carregandoDados, setCarregandoDados] = useState(false);
  
  const [todosDados, setTodosDados] = useState<any[]>([]);
  const [dadosEventos, setDadosEventos] = useState<any[]>([]);
  const [periodoSelecionado, setPeriodoSelecionado] = useState('');
  const [dadosFiltrados, setDadosFiltrados] = useState<any[]>([]);
  const [periodosDisponiveis, setPeriodosDisponiveis] = useState<string[]>([]);
  const [abaAtiva, setAbaAtiva] = useState('PCI');
  const [refreshing, setRefreshing] = useState(false);
  const [codigoEmpresa, setCodigoEmpresa] = useState<string>('');

  // Função para obter o logo da empresa - COM TODAS AS EMPRESAS
  const getEmpresaLogo = (empresaCodigo: string) => {
    if (!empresaCodigo) {
      return require('../../assets/images/default-company.png');
    }
    
    const codigoLower = empresaCodigo.toLowerCase().trim();
    
    // Mapeamento dinâmico de todas as empresas
    // Este objeto pode ser expandido conforme novas empresas são adicionadas
    const logos: {[key: string]: any} = {
      'rx': require('../../assets/images/rx.png'),
      'sg': require('../../assets/images/sg.png'),
      // Adicione mais empresas conforme necessário
      'ab': require('../../assets/images/ab.png'),
      'cd': require('../../assets/images/cd.png'),
      'ef': require('../../assets/images/ef.png'),
      'gh': require('../../assets/images/gh.png'),
      'ij': require('../../assets/images/ij.png'),
      'kl': require('../../assets/images/kl.png'),
      'mn': require('../../assets/images/mn.png'),
      'op': require('../../assets/images/op.png'),
      'qr': require('../../assets/images/qr.png'),
      'st': require('../../assets/images/st.png'),
      'uv': require('../../assets/images/uv.png'),
      'wx': require('../../assets/images/wx.png'),
      'yz': require('../../assets/images/yz.png'),
    };
    
    // Primeiro tenta o mapeamento direto
    if (logos[codigoLower]) {
      return logos[codigoLower];
    }
    
    // Se não encontrar no mapeamento, tenta carregar dinamicamente
    try {
      return require(`../../assets/images/${codigoLower}.png`);
    } catch (error) {
      console.log(`Logo não encontrado para empresa ${empresaCodigo}, usando padrão`);
      return require('../../assets/images/default-company.png');
    }
  };

  // Processar dados do admin ao carregar
  useEffect(() => {
    if (params.adminData) {
      try {
        const dados = JSON.parse(params.adminData as string);
        setAdminData(dados);
        
        // Extrair código da empresa - pode vir de diferentes campos
        let codigoEmpresaExtraido = '';
        
        if (dados.codigo_empresa) {
          codigoEmpresaExtraido = dados.codigo_empresa;
        } else if (dados.empresa) {
          codigoEmpresaExtraido = dados.empresa;
        } else if (dados.digitos && dados.digitos.length >= 2) {
          // Se não tiver código específico, pega os primeiros 2 caracteres dos dígitos
          codigoEmpresaExtraido = dados.digitos.substring(0, 2).toUpperCase();
        }
        
        setCodigoEmpresa(codigoEmpresaExtraido);
        
        console.log('👑 Admin logado:', {
          nome: dados.nome_empresa,
          codigo_empresa: codigoEmpresaExtraido,
          digitos: dados.digitos
        });
        
        // Buscar lista de operadores (sem selecionar automaticamente)
        buscarOperadores(dados.digitos);
      } catch (error) {
        console.error('❌ Erro ao processar adminData:', error);
        Alert.alert('Erro', 'Dados do administrador inválidos');
        router.back();
      }
    }
  }, [params.adminData]);

  // Função para normalizar texto (remover acentos e converter para maiúsculas)
  const normalizarTexto = (texto: string) => {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, ''); // Remove caracteres especiais, mantém letras, números e espaços
  };

  // Função para formatar entrada do usuário (somente letras, números e espaços)
  const formatarEntrada = (texto: string) => {
    // Remove acentos e caracteres especiais, converte para maiúsculas
    const textoNormalizado = normalizarTexto(texto);
    return textoNormalizado;
  };

  // Buscar lista de operadores (valores únicos)
  const buscarOperadores = async (digitosAdmin: string) => {
    setCarregandoOperadores(true);
    try {
      const API_OPERADORES = `https://api-motoristas-production.up.railway.app/api/admin/operadores/${digitosAdmin}`;
      console.log('🔍 Buscando operadores para admin:', digitosAdmin);
      
      const response = await fetch(API_OPERADORES);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          // Garantir valores únicos por dígitos do operador
          const operadoresUnicos = Array.from(
            new Map(
              result.data.map((op: any) => [op.digitos, op])
            ).values()
          ).map(op => ({
            digitos: op.digitos,
            nome: op.nome || `Operador ${op.digitos}`,
            matricula: op.matricula || 'N/A',
            empresa: op.empresa || '', // Extrair empresa do operador também
            nomeNormalizado: normalizarTexto(op.nome || `Operador ${op.digitos}`),
            matriculaNormalizada: normalizarTexto(op.matricula || 'N/A'),
            digitosNormalizado: normalizarTexto(op.digitos)
          }));
          
          setOperadores(operadoresUnicos);
          console.log('✅ Operadores únicos encontrados:', operadoresUnicos.length);
        } else {
          setOperadores([]);
          Alert.alert('Aviso', result.message || 'Nenhum operador encontrado');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Erro API operadores:', errorText);
        Alert.alert('Erro', 'Não foi possível carregar a lista de operadores');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar operadores:', error);
      Alert.alert('Erro', 'Erro de conexão ao buscar operadores');
    } finally {
      setCarregandoOperadores(false);
    }
  };

  // Selecionar operador (inicia consulta dos dados)
  const selecionarOperador = async (operador: any) => {
    console.log('👤 Selecionando operador:', operador.nome);
    setOperadorSelecionado(operador);
    setMostrarDropdown(false);
    
    // Resetar dados anteriores
    setTodosDados([]);
    setDadosFiltrados([]);
    setDadosEventos([]);
    setPeriodosDisponiveis([]);
    setPeriodoSelecionado('');
    
    // Buscar dados do operador selecionado
    await buscarDadosOperador(operador.digitos);
  };

  // Buscar dados do operador selecionado
  const buscarDadosOperador = async (digitosOperador: string) => {
    if (!digitosOperador || !adminData?.digitos) return;
    
    setCarregandoDados(true);
    try {
      const API_MOVIMENTOS = `https://api-motoristas-production.up.railway.app/api/admin/movimentos/${adminData.digitos}/operador/${digitosOperador}`;
      console.log('📊 Buscando dados do operador:', digitosOperador);
      
      const response = await fetch(API_MOVIMENTOS);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          console.log('✅ Dados do operador:', result.data.length);
          
          // Ordenar por data mais recente
          const dadosOrdenados = result.data.sort((a: any, b: any) => {
            const dataA = new Date(a.data_movimento);
            const dataB = new Date(b.data_movimento);
            return dataB.getTime() - dataA.getTime();
          });
          
          setTodosDados(dadosOrdenados);
          
          // Extrair períodos únicos
          const periodos = extrairPeriodosUnicos(dadosOrdenados);
          setPeriodosDisponiveis(periodos);
          
          if (periodos.length > 0) {
            const periodoPadrao = periodos[0];
            setPeriodoSelecionado(periodoPadrao);
            filtrarDadosPorPeriodo(periodoPadrao, dadosOrdenados);
            
            // Buscar eventos do período
            await buscarEventosOperador(digitosOperador, periodoPadrao);
          } else {
            setDadosFiltrados(dadosOrdenados);
            setDadosEventos([]);
          }
        } else {
          setTodosDados([]);
          setDadosFiltrados([]);
          setDadosEventos([]);
          Alert.alert('Aviso', result.message || 'Nenhum dado encontrado para este operador');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Erro API movimentos:', errorText);
        Alert.alert('Erro', 'Erro ao buscar dados do operador');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar dados:', error);
      Alert.alert('Erro', 'Erro de conexão ao buscar dados');
    } finally {
      setCarregandoDados(false);
    }
  };

  // Buscar eventos do operador
  const buscarEventosOperador = async (digitosOperador: string, periodo: string) => {
    if (!digitosOperador || !adminData?.digitos || !periodo) {
      setDadosEventos([]);
      return;
    }
    
    try {
      const API_EVENTOS = `https://api-motoristas-production.up.railway.app/api/admin/eventos/${adminData.digitos}?periodo=${periodo}`;
      console.log('📋 Buscando eventos para período:', periodo);
      
      const response = await fetch(API_EVENTOS);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          // Filtrar eventos apenas do operador selecionado
          const eventosOperador = result.data.filter((evento: any) => 
            evento.digitos === digitosOperador
          );
          
          const eventosProcessados = processarDadosEventos(eventosOperador);
          setDadosEventos(eventosProcessados);
          console.log('✅ Eventos do operador:', eventosProcessados.length);
        } else {
          setDadosEventos([]);
        }
      } else {
        setDadosEventos([]);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar eventos:', error);
      setDadosEventos([]);
    }
  };

  // Funções auxiliares (do dashboard original)
  const extrairPeriodosUnicos = (dados: any[]) => {
    const periodosSet = new Set<string>();
    
    dados.forEach(item => {
      if (item.data_movimento) {
        const periodo = extrairPeriodoDaData(item.data_movimento);
        if (periodo) {
          periodosSet.add(periodo);
        }
      }
    });
    
    return Array.from(periodosSet).sort().reverse();
  };

  const extrairPeriodoDaData = (dataString: string) => {
    if (!dataString) return '';
    
    try {
      const date = new Date(dataString);
      if (isNaN(date.getTime())) return '';
      
      const ano = date.getUTCFullYear();
      const mes = (date.getUTCMonth() + 1).toString().padStart(2, '0');
      return `${ano}-${mes}`;
    } catch {
      return '';
    }
  };

  const processarDadosEventos = (eventos: any[]) => {
    const eventosProcessados = eventos.map(item => {
      const totalPontos = parseFloat(item.total_pontos_evento || '0');
      
      return {
        ...item,
        tipo_evento: item.dsc_evento || item.tipo_evento || 'Evento',
        descricao: item.dsc_evento || item.descricao || 'Descrição não disponível',
        ponto_evento: item.ponto_evento || '0',
        total_ocorrencias: item.total || '0',
        total_pontos: item.total_pontos_evento || '0',
        temPontosPositivos: totalPontos > 0
      };
    });

    return eventosProcessados.sort((a, b) => {
      if (a.temPontosPositivos && !b.temPontosPositivos) return -1;
      if (!a.temPontosPositivos && b.temPontosPositivos) return 1;
      
      const tipoA = a.tipo_evento || '';
      const tipoB = b.tipo_evento || '';
      return tipoA.localeCompare(tipoB);
    });
  };

  const filtrarDadosPorPeriodo = (periodo: string, dados: any[] = todosDados) => {
    const filtrados = dados.filter(item => {
      const periodoItem = extrairPeriodoDaData(item.data_movimento);
      return periodoItem === periodo;
    });
    
    const filtradosOrdenados = filtrados.sort((a, b) => {
      const dataA = new Date(a.data_movimento);
      const dataB = new Date(b.data_movimento);
      return dataB.getTime() - dataA.getTime();
    });
    
    setDadosFiltrados(filtradosOrdenados);
  };

  const mudarPeriodo = async (novoPeriodo: string) => {
    setPeriodoSelecionado(novoPeriodo);
    filtrarDadosPorPeriodo(novoPeriodo);
    
    if (operadorSelecionado) {
      await buscarEventosOperador(operadorSelecionado.digitos, novoPeriodo);
    }
  };

  const formatarPeriodo = (periodo: string) => {
    if (!periodo) return 'Selecionar';
    
    try {
      const partes = periodo.split('-');
      if (partes.length >= 2) {
        const ano = partes[0];
        const mesNumero = parseInt(partes[1], 10);
        
        const meses = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        
        const mes = meses[mesNumero - 1];
        return `${mes}/${ano}`;
      }
      
      return 'Período';
    } catch {
      return 'Período';
    }
  };

  // Preparar dados para o gráfico - CORRIGIDO
  const prepararDadosGraficoMensal = () => {
    if (todosDados.length === 0) return null;

    const dadosPorMes: { [key: string]: any[] } = {};
    
    todosDados.forEach(item => {
      const chaveMes = extrairPeriodoDaData(item.data_movimento);
      
      if (chaveMes) {
        if (!dadosPorMes[chaveMes]) {
          dadosPorMes[chaveMes] = [];
        }
        dadosPorMes[chaveMes].push(item);
      }
    });

    // Ordenar os meses de forma crescente (mais antigo para mais recente)
    const mesesOrdenados = Object.keys(dadosPorMes).sort();

    if (mesesOrdenados.length === 0) return null;

    // Pegar os últimos 6 meses (ou todos se tiver menos)
    const ultimosMeses = mesesOrdenados.slice(-6);

    const labels = ultimosMeses.map(mes => {
      const partes = mes.split('-');
      if (partes.length >= 2) {
        return `${partes[1]}/${partes[0].slice(2)}`; // MM/AA
      }
      return mes;
    });

    const data = ultimosMeses.map(mes => {
      const dadosMes = dadosPorMes[mes];
      if (!dadosMes || dadosMes.length === 0) return 0;
      
      // Calcular a média das pontuações diárias para o mês
      const soma = dadosMes.reduce((sum, item) => {
        const valor = parseFloat(item.pontuacao_diaria) || 0;
        return sum + (isNaN(valor) ? 0 : valor);
      }, 0);
      
      const media = dadosMes.length > 0 ? soma / dadosMes.length : 0;
      return isFinite(media) ? parseFloat(media.toFixed(2)) : 0;
    });

    console.log('📊 Dados para gráfico:', { labels, data, mesesOrdenados });

    const dadosValidos = data.some(valor => valor > 0);
    if (!dadosValidos || labels.length === 0) return null;

    return {
      labels,
      datasets: [{
        data,
        color: (opacity = 1) => `rgba(30, 58, 138, ${opacity})`,
        strokeWidth: 2
      }]
    };
  };

  const formatNumber = (num: any) => {
    if (num === null || num === undefined) return '-';
    const number = parseFloat(num);
    return isNaN(number) ? '-' : number.toFixed(4).replace('.', ',');
  };

  const formatInteger = (num: any) => {
    if (num === null || num === undefined) return '-';
    const number = parseInt(num);
    return isNaN(number) ? '-' : number.toString();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';

    try {
      const date = new Date(dateString);
      const day = date.getUTCDate().toString().padStart(2, '0');
      const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
      const yearFull = date.getUTCFullYear().toString().slice(-2);

      return `${day}/${month}/${yearFull}`;
    } catch {
      return '-';
    }
  };

  const getRowColor = (cor_selo: string) => {
    if (!cor_selo) return '#ffffff';
    
    const colors: { [key: string]: string } = {
      'VERMELHO': '#ff6b6b',
      'VERDE': '#51cf66',
      'DOURADO': '#ab7e5c',
      'AMARELO': '#ffd700ff'
    };
    return colors[cor_selo] || '#ffffff';
  };

  // Filtrar operadores por busca
  const operadoresFiltrados = buscaOperador 
    ? operadores.filter(op =>
        op.nomeNormalizado?.includes(normalizarTexto(buscaOperador)) ||
        op.matriculaNormalizada?.includes(normalizarTexto(buscaOperador)) ||
        op.digitosNormalizado?.includes(normalizarTexto(buscaOperador))
      )
    : operadores;

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    if (adminData?.digitos) {
      await buscarOperadores(adminData.digitos);
    }
    setRefreshing(false);
  };

  // Sair do modo admin
  const sair = () => {
    router.replace('/');
  };

  // Limpar seleção
  const limparSelecao = () => {
    setOperadorSelecionado(null);
    setTodosDados([]);
    setDadosFiltrados([]);
    setDadosEventos([]);
    setPeriodosDisponiveis([]);
    setPeriodoSelecionado('');
    setBuscaOperador('');
  };

  // Loading inicial
  if (carregandoOperadores) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {codigoEmpresa && (
              <Image 
                source={getEmpresaLogo(codigoEmpresa)} 
                style={styles.logoEmpresa}
                resizeMode="contain"
              />
            )}
            <Text style={styles.greeting}>
              {adminData?.nome_empresa || 'Modo Administrador'}
            </Text>
            <TouchableOpacity style={styles.logoutButton} onPress={sair}>
              <Text style={styles.logoutButtonText}>Sair</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e3a8a" />
          <Text style={styles.loadingText}>Carregando operadores...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Dados para o gráfico
  const dadosGrafico = prepararDadosGraficoMensal();
  console.log('📈 Gráfico disponível?', dadosGrafico ? 'Sim' : 'Não');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1e3a8a']}
          />
        }
      >
        {/* HEADER ADMIN */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {codigoEmpresa && (
              <Image 
                source={getEmpresaLogo(codigoEmpresa)} 
                style={styles.logoEmpresa}
                resizeMode="contain"
              />
            )}
            <Text style={styles.greeting}>
              {adminData?.nome_empresa || 'Modo Administrador'}
            </Text>
            <TouchableOpacity style={styles.logoutButton} onPress={sair}>
              <Text style={styles.logoutButtonText}>Sair</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SELEÇÃO DE OPERADOR */}
        <View style={styles.selectionSection}>
          <Text style={styles.sectionTitle}>Selecionar Operador</Text>
          
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="BUSCAR OPERADOR POR NOME, MATRÍCULA OU DÍGITOS..."
              placeholderTextColor="#94a3b8"
              value={buscaOperador}
              onChangeText={(text) => {
                const textoFormatado = formatarEntrada(text);
                setBuscaOperador(textoFormatado);
              }}
              onFocus={() => setMostrarDropdown(true)}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            
            {operadorSelecionado && (
              <View style={styles.operadorSelecionadoCard}>
                <Text style={styles.operadorNome}>
                  {operadorSelecionado.nome}
                </Text>
                <View style={styles.operadorInfoRow}>
                  <Text style={styles.operadorInfo}>
                    Matrícula: {operadorSelecionado.matricula}
                  </Text>
                  <Text style={styles.operadorInfo}>
                    Dígitos: {operadorSelecionado.digitos}
                  </Text>
                  {operadorSelecionado.empresa && (
                    <Text style={styles.operadorInfo}>
                      Empresa: {operadorSelecionado.empresa}
                    </Text>
                  )}
                </View>
                <TouchableOpacity 
                  style={styles.limparButton}
                  onPress={limparSelecao}
                >
                  <Text style={styles.limparButtonText}>Limpar seleção</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {mostrarDropdown && operadoresFiltrados.length > 0 && (
              <View style={styles.dropdownMenu}>
                <ScrollView 
                  style={styles.dropdownScroll} 
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={true}
                >
                  {operadoresFiltrados.map((op, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dropdownItem,
                        operadorSelecionado?.digitos === op.digitos && styles.dropdownItemSelecionado
                      ]}
                      onPress={() => selecionarOperador(op)}
                    >
                      <Text style={styles.dropdownItemText}>
                        {op.nome}
                      </Text>
                      <View style={styles.dropdownItemInfo}>
                        <Text style={styles.dropdownItemSubtext}>
                          Matrícula: {op.matricula}
                        </Text>
                        <Text style={styles.dropdownItemSubtext}>
                          Dígitos: {op.digitos}
                        </Text>
                        {op.empresa && (
                          <Text style={styles.dropdownItemSubtext}>
                            Empresa: {op.empresa}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            {mostrarDropdown && operadoresFiltrados.length === 0 && (
              <View style={styles.dropdownMenu}>
                <View style={styles.dropdownEmpty}>
                  <Text style={styles.dropdownEmptyText}>
                    NENHUM OPERADOR ENCONTRADO
                  </Text>
                </View>
              </View>
            )}
          </View>
          
          {operadores.length === 0 && (
            <View style={styles.noOperadores}>
              <Text style={styles.noOperadoresText}>
                NENHUM OPERADOR ENCONTRADO PARA ESTA EMPRESA
              </Text>
            </View>
          )}
        </View>

        {/* DADOS DO OPERADOR SELECIONADO */}
        {operadorSelecionado && (
          <>
            {/* PERÍODO SELECIONADO */}
            {periodosDisponiveis.length > 0 && (
              <View style={styles.periodoContainer}>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity 
                    style={styles.periodoButton}
                    onPress={() => setMostrarDropdown(!mostrarDropdown)}
                  >
                    <Text style={styles.periodoButtonText}>
                      {formatarPeriodo(periodoSelecionado) || 'Selecionar período'}
                    </Text>
                    <Text style={styles.periodoArrow}>▼</Text>
                  </TouchableOpacity>

                  {mostrarDropdown && (
                    <View style={styles.periodoDropdownMenu}>
                      {periodosDisponiveis.map((periodo) => (
                        <TouchableOpacity
                          key={periodo}
                          style={[
                            styles.periodoDropdownItem,
                            periodo === periodoSelecionado && styles.periodoDropdownItemSelecionado
                          ]}
                          onPress={() => {
                            mudarPeriodo(periodo);
                            setMostrarDropdown(false);
                          }}
                        >
                          <Text style={[
                            styles.periodoDropdownItemText,
                            periodo === periodoSelecionado && styles.periodoDropdownItemTextSelecionado
                          ]}>
                            {formatarPeriodo(periodo)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* CARDS DE RESUMO */}
            {carregandoDados ? (
              <View style={styles.loadingDataContainer}>
                <ActivityIndicator size="large" color="#1e3a8a" />
                <Text style={styles.loadingText}>Carregando dados...</Text>
              </View>
            ) : dadosFiltrados.length > 0 ? (
              <>
                <View style={styles.cardsContainer}>
                  <View style={styles.cardRow}>
                    <View style={styles.card}>
                      <Text style={styles.cardValue}>
                        {formatNumber(dadosFiltrados[0]?.media_pontos)}
                      </Text>
                      <Text style={styles.cardLabel}>Pontuação</Text>
                    </View>

                    <View style={styles.card}>
                      <Text style={styles.cardValue}>
                        {dadosFiltrados[0]?.ranking || '-'}°
                      </Text>
                      <Text style={styles.cardLabel}>Ranking</Text>
                    </View>
                  </View>
                  
                  <View style={styles.fullWidthCard}>
                    <Text style={styles.fullWidthCardValue}>
                      {dadosFiltrados[0]?.desempenho || 'ÓTIMO'}
                    </Text>
                    <Text style={styles.fullWidthCardLabel}>Desempenho</Text>
                  </View>
                </View>

                {/* ABAS */}
                <View style={styles.abasContainer}>
                  <TouchableOpacity 
                    style={[styles.aba, abaAtiva === 'PCI' && styles.abaAtiva]}
                    onPress={() => setAbaAtiva('PCI')}
                  >
                    <Text style={[styles.abaTexto, abaAtiva === 'PCI' && styles.abaTextoAtiva]}>
                      PCI ({dadosFiltrados.length})
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.aba, abaAtiva === 'EVENTOS' && styles.abaAtiva]}
                    onPress={() => setAbaAtiva('EVENTOS')}
                  >
                    <Text style={[styles.abaTexto, abaAtiva === 'EVENTOS' && styles.abaTextoAtiva]}>
                      EVENTOS ({dadosEventos.length})
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* CONTEÚDO DAS ABAS */}
                {abaAtiva === 'PCI' && (
                  <View>
                    {/* HISTÓRICO DETALHADO */}
                    <View style={styles.movementsSection}>
                      <View style={styles.gridHeader}>
                        <Text style={[styles.gridHeaderText, styles.colData]}>Data</Text>
                        <Text style={[styles.gridHeaderText, styles.colVeiculo]}>Veículo</Text>
                        <Text style={[styles.gridHeaderText, styles.colMeta]}>Meta</Text>
                        <Text style={[styles.gridHeaderText, styles.colSelo]}>Selo</Text>
                        <Text style={[styles.gridHeaderText, styles.colPts]}>Pts</Text>
                      </View>

                      {dadosFiltrados.map((item, index) => (
                        <View 
                          key={index}
                          style={[
                            styles.gridRow, 
                            { backgroundColor: getRowColor(item.cor_selo_diario) }
                          ]}
                        >
                          <Text style={[styles.gridCell, styles.colData]}>
                            {formatDate(item.data_movimento)}
                          </Text>
                          <Text style={[styles.gridCell, styles.colVeiculo]}>
                            {item.veiculo || '-'}
                          </Text>
                          <Text style={[styles.gridCell, styles.colMeta]}>
                            {formatNumber(item.meta_dourado)}
                          </Text>
                          <Text style={[styles.gridCell, styles.colSelo]}>
                            {item.cor_selo_diario || '-'}
                          </Text>
                          <Text style={[styles.gridCell, styles.colPts]}>
                            {formatNumber(item.pontuacao_diaria)}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* GRÁFICO DE EVOLUÇÃO */}
                    {dadosGrafico ? (
                      <View style={styles.chartContainer}>
                        <Text style={styles.chartTitle}>Evolução de Pontuações (Mensal)</Text>
                        <LineChart
                          data={dadosGrafico}
                          width={Dimensions.get('window').width - 32}
                          height={220}
                          chartConfig={{
                            backgroundColor: '#ffffff',
                            backgroundGradientFrom: '#ffffff',
                            backgroundGradientTo: '#ffffff',
                            decimalPlaces: 1,
                            color: (opacity = 1) => `rgba(30, 58, 138, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                            style: {
                              borderRadius: 16
                            },
                            propsForDots: {
                              r: '4',
                              strokeWidth: '2',
                              stroke: '#1e3a8a'
                            }
                          }}
                          bezier
                          style={styles.chart}
                        />
                      </View>
                    ) : (
                      <View style={styles.chartContainer}>
                        <Text style={styles.chartTitle}>Evolução de Pontuações (Mensal)</Text>
                        <Text style={styles.placeholderText}>
                          Dados insuficientes para exibir o gráfico
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {abaAtiva === 'EVENTOS' && (
                  <View style={styles.movementsSection}>
                    {dadosEventos.length > 0 ? (
                      <>
                        <View style={styles.gridHeader}>
                          <Text style={[styles.gridHeaderText, styles.colTipoEvento]}>Tipo de Evento</Text>
                          <Text style={[styles.gridHeaderText, styles.colOcorrencias]}>Qtde</Text>
                          <Text style={[styles.gridHeaderText, styles.colPontosEvento]}>Pontos/Un.</Text>
                          <Text style={[styles.gridHeaderText, styles.colTotalPontos]}>Total Pontos</Text>
                        </View>

                        {dadosEventos.map((evento, index) => {
                          const totalPontos = evento.total_pontos || evento.total_pontos_evento || 0;
                          const temPontosPositivos = parseFloat(totalPontos) > 0;
                          
                          return (
                            <View 
                              key={index}
                              style={[
                                styles.gridRow,
                                temPontosPositivos && styles.linhaVermelha
                              ]}
                            >
                              <Text style={[
                                styles.gridCell, 
                                styles.colTipoEvento,
                                temPontosPositivos && styles.textoVermelho
                              ]}>
                                {evento.tipo_evento || evento.descricao || '-'}
                              </Text>
                              <Text style={[
                                styles.gridCell, 
                                styles.colOcorrencias,
                                temPontosPositivos && styles.textoVermelho
                              ]}>
                                {formatInteger(evento.total_ocorrencias || evento.total || '0')}
                              </Text>
                              <Text style={[
                                styles.gridCell, 
                                styles.colPontosEvento,
                                temPontosPositivos && styles.textoVermelho
                              ]}>
                                {formatNumber(evento.ponto_evento)}
                              </Text>
                              <Text style={[
                                styles.gridCell, 
                                styles.colTotalPontos,
                                temPontosPositivos && styles.textoVermelho
                              ]}>
                                {formatNumber(totalPontos)}
                              </Text>
                            </View>
                          );
                        })}
                      </>
                    ) : (
                      <View style={styles.noDataContainer}>
                        <Text style={styles.placeholderText}>
                          Nenhum evento registrado para este período
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </>
            ) : operadorSelecionado ? (
              <View style={styles.noDataContainer}>
                <Text style={styles.placeholderText}>
                  Nenhum dado disponível para este operador
                </Text>
              </View>
            ) : null}
          </>
        )}

        {/* SE NÃO HÁ OPERADOR SELECIONADO */}
        {!operadorSelecionado && !carregandoOperadores && operadores.length > 0 && (
          <View style={styles.noSelectionContainer}>
            <Text style={styles.noSelectionText}>
              Selecione um operador na busca acima para visualizar seus dados
            </Text>
            <Text style={styles.noSelectionSubtext}>
              {operadores.length} operadores disponíveis
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },
  header: { 
    backgroundColor: '#1e3a8a', 
    padding: 20, 
    paddingTop: 20
  },
  headerContent: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoEmpresa: {
    width: 32,
    height: 32,
    marginRight: 12,
    borderRadius: 4,
  },
  greeting: { 
    fontSize: 16,
    fontWeight: 'bold', 
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  selectionSection: {
    padding: 16,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  searchContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  searchInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    textTransform: 'uppercase',
    fontWeight: '600',
    color: '#1e293b',
  },
  operadorSelecionadoCard: {
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#93c5fd',
    marginBottom: 8,
  },
  operadorNome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  operadorInfoRow: {
    flexDirection: 'column',
    marginBottom: 8,
  },
  operadorInfo: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
  },
  limparButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  limparButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1001,
  },
  dropdownScroll: {
    maxHeight: 300,
  },
  dropdownEmpty: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownEmptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '600',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemSelecionado: {
    backgroundColor: '#dbeafe',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
    marginBottom: 4,
  },
  dropdownItemInfo: {
    flexDirection: 'column',
  },
  dropdownItemSubtext: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  noOperadores: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  noOperadoresText: {
    fontSize: 14,
    color: '#b91c1c',
    textAlign: 'center',
    fontWeight: '600',
  },
  periodoContainer: {
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  dropdownContainer: { 
    width: '100%', 
    maxWidth: 200,
    alignSelf: 'center',
    position: 'relative' 
  },
  periodoButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: 'white', 
    padding: 12, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#dbeafe',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  periodoButtonText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#1e3a8a' 
  },
  periodoArrow: { 
    fontSize: 10, 
    color: '#1e3a8a' 
  },
  periodoDropdownMenu: {
    position: 'absolute', 
    top: '100%', 
    left: 0, 
    right: 0, 
    backgroundColor: 'white',
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    marginTop: 4,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1,
    shadowRadius: 8, 
    elevation: 4, 
    zIndex: 1000,
  },
  periodoDropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  periodoDropdownItemSelecionado: { 
    backgroundColor: '#dbeafe' 
  },
  periodoDropdownItemText: { 
    fontSize: 12, 
    color: '#374151', 
    textAlign: 'center' 
  },
  periodoDropdownItemTextSelecionado: { 
    color: '#1e3a8a', 
    fontWeight: '600' 
  },
  cardsContainer: { 
    padding: 16, 
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12
  },
  card: {
    flex: 1,
    backgroundColor: 'white', 
    padding: 16, 
    borderRadius: 8,
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  fullWidthCard: {
    backgroundColor: 'white', 
    padding: 16, 
    borderRadius: 8,
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%'
  },
  cardValue: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#1e293b', 
    marginBottom: 4 
  },
  cardLabel: { 
    fontSize: 12, 
    color: '#64748b', 
    fontWeight: '500' 
  },
  fullWidthCardValue: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#1e293b', 
    marginBottom: 4 
  },
  fullWidthCardLabel: { 
    fontSize: 14, 
    color: '#64748b', 
    fontWeight: '500' 
  },
  abasContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 4,
  },
  aba: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  abaAtiva: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  abaTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  abaTextoAtiva: {
    color: '#1e3a8a',
  },
  movementsSection: { 
    padding: 16 
  },
  gridHeader: {
    flexDirection: 'row', 
    backgroundColor: '#1e3a8a', 
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderTopLeftRadius: 8, 
    borderTopRightRadius: 8,
  },
  gridHeaderText: {
    color: 'white', 
    fontWeight: '600', 
    fontSize: 12,
    textAlign: 'center',
  },
  colData: { width: '22%' },
  colVeiculo: { width: '15%' },
  colMeta: { width: '18%' },
  colSelo: { width: '25%' },
  colPts: { width: '20%' },
  colTipoEvento: { width: '40%' },
  colOcorrencias: { width: '15%' },
  colPontosEvento: { width: '22%' },
  colTotalPontos: { width: '23%' },
  gridRow: {
    flexDirection: 'row', 
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 2, 
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
    minHeight: 40,
    backgroundColor: '#ffffff',
  },
  gridCell: { 
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    color: '#374151'
  },
  linhaVermelha: {
    backgroundColor: '#fff5f5',
  },
  textoVermelho: {
    color: '#ff0000',
    fontWeight: 'bold',
  },
  chartContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center'
  },
  chart: {
    borderRadius: 8,
  },
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  placeholderText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingDataContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
  },
  noSelectionContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  noSelectionText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
  noSelectionSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});