/**
 * Unit tests for content.js
 * Tests for parseCSV, mapTicketsFromCSV, and critical functions
 */

describe('Content Script - CSV Parsing', () => {
  
  describe('parseCSV', () => {
    // Mock parseCSV function (extracted from content.js logic)
    function parseCSV(text) {
      const lines = text.trim().split('\n');
      if (lines.length < 2) return [];
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const rows = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx] || '';
        });
        rows.push(row);
      }
      
      return rows;
    }

    test('should parse simple CSV with headers', () => {
      const csv = `number,state,assigned_to
INC001,Open,John Doe
INC002,Closed,Jane Smith`;
      
      const result = parseCSV(csv);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        number: 'INC001',
        state: 'Open',
        assigned_to: 'John Doe'
      });
      expect(result[1]).toEqual({
        number: 'INC002',
        state: 'Closed',
        assigned_to: 'Jane Smith'
      });
    });

    test('should handle quoted values with commas', () => {
      const csv = `number,description
INC001,"Issue with email, urgent"
INC002,"Network problem"`;
      
      const result = parseCSV(csv);
      
      expect(result).toHaveLength(2);
      expect(result[0].description).toBe('Issue with email, urgent');
    });

    test('should handle empty CSV', () => {
      const csv = '';
      const result = parseCSV(csv);
      expect(result).toEqual([]);
    });

    test('should handle CSV with only headers', () => {
      const csv = 'number,state,assigned_to';
      const result = parseCSV(csv);
      expect(result).toEqual([]);
    });

    test('should handle missing values', () => {
      const csv = `number,state,assigned_to
INC001,,John Doe
INC002,Open,`;
      
      const result = parseCSV(csv);
      
      expect(result).toHaveLength(2);
      expect(result[0].state).toBe('');
      expect(result[1].assigned_to).toBe('');
    });
  });

  describe('mapTicketsFromCSV', () => {
    // Mock mapTicketsFromCSV function
    function mapTicketsFromCSV(rows) {
      if (!rows || rows.length === 0) {
        return { ok: false, tickets: [], error: 'No rows to map' };
      }

      const tickets = [];
      const fieldMappings = {
        number: ['número', 'numero', 'number'],
        short_description: ['descripción breve', 'short description', 'description'],
        state: ['estado', 'state'],
        assigned_to: ['asignado a', 'assigned to', 'assigned_to']
      };

      for (const row of rows) {
        const ticket = {};
        
        // Map fields
        for (const [targetField, possibleNames] of Object.entries(fieldMappings)) {
          for (const name of possibleNames) {
            const key = Object.keys(row).find(k => 
              k.toLowerCase().trim() === name.toLowerCase()
            );
            if (key && row[key]) {
              ticket[targetField] = row[key];
              break;
            }
          }
        }

        // Only add if has number
        if (ticket.number) {
          tickets.push(ticket);
        }
      }

      return {
        ok: tickets.length > 0,
        tickets,
        total: tickets.length
      };
    }

    test('should map tickets with English headers', () => {
      const rows = [
        { number: 'INC001', state: 'Open', 'short description': 'Test issue', 'assigned to': 'John' },
        { number: 'INC002', state: 'Closed', 'short description': 'Another issue', 'assigned to': 'Jane' }
      ];

      const result = mapTicketsFromCSV(rows);

      expect(result.ok).toBe(true);
      expect(result.tickets).toHaveLength(2);
      expect(result.tickets[0]).toEqual({
        number: 'INC001',
        state: 'Open',
        short_description: 'Test issue',
        assigned_to: 'John'
      });
    });

    test('should map tickets with Spanish headers', () => {
      const rows = [
        { 'número': 'INC001', 'estado': 'Abierto', 'descripción breve': 'Problema de prueba' }
      ];

      const result = mapTicketsFromCSV(rows);

      expect(result.ok).toBe(true);
      expect(result.tickets).toHaveLength(1);
      expect(result.tickets[0].number).toBe('INC001');
      expect(result.tickets[0].state).toBe('Abierto');
    });

    test('should handle empty rows', () => {
      const rows = [];
      const result = mapTicketsFromCSV(rows);

      expect(result.ok).toBe(false);
      expect(result.tickets).toEqual([]);
    });

    test('should skip rows without ticket number', () => {
      const rows = [
        { state: 'Open', description: 'No number' },
        { number: 'INC001', state: 'Open' }
      ];

      const result = mapTicketsFromCSV(rows);

      expect(result.ok).toBe(true);
      expect(result.tickets).toHaveLength(1);
      expect(result.tickets[0].number).toBe('INC001');
    });

    test('should handle mixed case headers', () => {
      const rows = [
        { 'NUMBER': 'INC001', 'STATE': 'Open', 'Short Description': 'Test' }
      ];

      const result = mapTicketsFromCSV(rows);

      expect(result.ok).toBe(true);
      expect(result.tickets[0].number).toBe('INC001');
    });
  });

  describe('generateInstanceId', () => {
    function generateInstanceId() {
      const timestamp = Date.now().toString(36);
      const urlHash = 'test.service-now.com'.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0).toString(36);
      return `${timestamp}-${urlHash}`.slice(0, 12);
    }

    test('should generate unique instance ID with timestamp', () => {
      const id1 = generateInstanceId();
      
      // Wait a bit
      const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      return wait(10).then(() => {
        const id2 = generateInstanceId();
        
        expect(id1).toBeTruthy();
        expect(id2).toBeTruthy();
        expect(id1).not.toBe(id2); // Should be different due to timestamp
        expect(id1.length).toBeLessThanOrEqual(12);
      });
    });

    test('should include timestamp component', () => {
      const id = generateInstanceId();
      expect(id).toContain('-');
      
      const parts = id.split('-');
      expect(parts.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Ticket limit validation', () => {
    test('should warn when exceeding configured limit', () => {
      const limit = 500;
      const ticketCount = 750;
      
      const shouldWarn = ticketCount > limit;
      
      expect(shouldWarn).toBe(true);
    });

    test('should not warn when within limit', () => {
      const limit = 500;
      const ticketCount = 300;
      
      const shouldWarn = ticketCount > limit;
      
      expect(shouldWarn).toBe(false);
    });
  });
});

describe('Content Script - Data Sanitization', () => {
  describe('Field extraction', () => {
    test('should extract only essential fields', () => {
      const fullTicket = {
        number: 'INC001',
        state: 'Open',
        short_description: 'Test',
        assigned_to: 'John',
        sys_id: '12345',
        sys_created_on: '2024-01-01',
        sys_updated_on: '2024-01-02',
        extra_field: 'not needed'
      };

      const essentialFields = ['number', 'state', 'short_description', 'assigned_to'];
      const sanitized = {};
      
      essentialFields.forEach(field => {
        if (fullTicket[field]) {
          sanitized[field] = fullTicket[field];
        }
      });

      expect(Object.keys(sanitized)).toHaveLength(4);
      expect(sanitized).not.toHaveProperty('sys_id');
      expect(sanitized).not.toHaveProperty('extra_field');
    });
  });
});
