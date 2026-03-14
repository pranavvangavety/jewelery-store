package com.jewelrystore.product.service;

import com.github.slugify.Slugify;
import com.jewelrystore.product.dto.CategoryRequest;
import com.jewelrystore.product.dto.CategoryResponse;
import com.jewelrystore.product.entity.Category;
import com.jewelrystore.product.exception.DuplicateResourceException;
import com.jewelrystore.product.exception.ResourceNotFoundException;
import com.jewelrystore.product.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final Slugify slugify = Slugify.builder().build();

    public CategoryResponse createCategory(CategoryRequest request) {
        if(categoryRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Category already exists: " + request.getName());
        }

        Category category = Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .slug(generateSlug(request.getName()))
                .build();

        Category saved = categoryRepository.save(category);
        log.info("Created category: {}", saved.getName());
        return mapToResponse(saved);
    }


    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }


    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        categoryRepository.delete(category);
        log.info("Deleted Category: {}", category.getName());
    }


    private CategoryResponse mapToResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .slug(category.getSlug())
                .build();
    }


    private String generateSlug(String name) {
        return slugify.slugify(name);
    }

}
