/**
 * Mock demo fixtures
 * AI Mold Cost Evaluation Agent - local UI demo
 */

window.__MOCK_FIXTURES__ = {
    demoCredentials: {
        username: 'demo',
        password: 'Demo123'
    },

    kbSources: [
        {
            doc_id: 'mock_doc_injection_guide',
            source_doc: 'Injection Mold Design Spec.pdf',
            chunk_id: 'mock_chunk_001',
            summary_id: 'mock_summary_001',
            page_start: 12,
            page_end: 13,
            retrieval_source: 'merged_chunk',
            section: 'Technical requirements',
            text: 'When designing an injection mold, cavity count should be set based on production volume and mold life; single-cavity molds suit trials and small batches, while multi-cavity molds raise throughput but need cavity layout and clamp-force consideration.'
        },
        {
            doc_id: 'mock_doc_material_price',
            source_doc: 'Mold Material Unit Price Table.pdf',
            chunk_id: 'mock_chunk_002',
            summary_id: 'mock_summary_002',
            page_start: 5,
            page_end: 5,
            retrieval_source: 'structured_table',
            section: 'Material unit price',
            text: '718H mold steel reference price is 45 CNY/kg, P20 is 28 CNY/kg, and S136 stainless is 68 CNY/kg.'
        }
    ],

    quoteResult: {
        mold_price: 286800,
        calculation_detail: {
            mold_type: 'injection',
            part_length: 140,
            part_width: 94,
            part_height: 23,
            cavity_count: 1,
            cavity_layout: {
                cavity_count: 1,
                spacing: 0,
                arrangement: 'single'
            },
            material_ratio: 0.35,
            difficulty_factor: 1.05,
            surface_requirement: '',
            surface_area_cm2: 0,
            material_price_table: {
                '718H': 45,
                'P20': 28,
                'S136': 68,
                '45#': 12
            },
            parts: [
                { name: 'Cavity Insert', row_key: 'cavity', length: 220, width: 180, height: 90, material: '718H', weight_kg: 28.1, material_cost: 12645, unit_price: 45 },
                { name: 'Core Insert', row_key: 'core', length: 220, width: 180, height: 85, material: '718H', weight_kg: 26.5, material_cost: 11925, unit_price: 45 },
                { name: 'Cavity Plate', row_key: 'fix_plate', length: 280, width: 240, height: 40, material: 'P20', weight_kg: 21.1, material_cost: 5908, unit_price: 28 },
                { name: 'Core Plate', row_key: 'move_plate', length: 280, width: 240, height: 35, material: 'P20', weight_kg: 18.5, material_cost: 5180, unit_price: 28 },
                { name: 'Top Plate', row_key: 'top_plate', length: 260, width: 220, height: 25, material: '45#', weight_kg: 11.3, material_cost: 1356, unit_price: 12 },
                { name: 'Hot Runner Plate', row_key: 'hotrunner_plate', length: 260, width: 220, height: 30, material: 'P20', weight_kg: 13.6, material_cost: 3808, unit_price: 28 },
                { name: 'Ejector Plate 1', row_key: 'ejector_plate1', length: 240, width: 200, height: 20, material: '45#', weight_kg: 7.5, material_cost: 900, unit_price: 12 },
                { name: 'Ejector Plate 2', row_key: 'ejector_plate2', length: 240, width: 200, height: 20, material: '45#', weight_kg: 7.5, material_cost: 900, unit_price: 12 },
                { name: 'Mold Foot', row_key: 'mold_foot', length: 280, width: 60, height: 80, material: '45#', weight_kg: 10.6, material_cost: 1272, unit_price: 12 },
                { name: 'Bottom Plate', row_key: 'bottom_plate', length: 280, width: 240, height: 30, material: '45#', weight_kg: 15.8, material_cost: 1896, unit_price: 12 }
            ],
            material_detail: [],
            electrode_cost: 12000,
            slider_cost: 0,
            hotrunner_cost: 8500,
            polishing_cost: 0,
            texture_cost: 0,
            oil_cylinder_cost: 0,
            standard_parts_cost: 6800,
            other_cost: 3200,
            has_slider: false,
            hotrunner_points: 2,
            hotrunner_point_cost: 4250
        }
    },

    kbDocuments: [
        {
            doc_id: 'mock_doc_injection_guide',
            filename: 'Injection Mold Design Spec.pdf',
            chunk_count: 18,
            raw_chunk_count: 42,
            total_merged_chunks: 18,
            total_chunks: 42,
            created_at: '2026-06-18T10:20:00.000Z',
            last_retrieved_at: '2026-07-01T08:15:00.000Z'
        },
        {
            doc_id: 'mock_doc_material_price',
            filename: 'Mold Material Unit Price Table.pdf',
            chunk_count: 6,
            raw_chunk_count: 14,
            total_merged_chunks: 6,
            total_chunks: 14,
            created_at: '2026-06-20T14:30:00.000Z',
            last_retrieved_at: '2026-06-28T16:40:00.000Z'
        }
    ]
}

window.__MOCK_FIXTURES__.quoteResult.calculation_detail.material_detail =
    window.__MOCK_FIXTURES__.quoteResult.calculation_detail.parts.map(part => ({ ...part }))
